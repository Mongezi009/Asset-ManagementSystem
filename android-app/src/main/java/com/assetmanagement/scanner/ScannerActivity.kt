package com.assetmanagement.scanner

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ScannerActivity : AppCompatActivity() {
    private lateinit var previewView: PreviewView
    private lateinit var statusText: TextView
    private lateinit var manualButton: Button
    private lateinit var logoutButton: Button
    private lateinit var cameraExecutor: ExecutorService
    private var isProcessing = false

    companion object {
        private const val REQUEST_CAMERA_PERMISSION = 10
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scanner)

        initViews()
        cameraExecutor = Executors.newSingleThreadExecutor()

        if (checkCameraPermission()) {
            startCamera()
        } else {
            requestCameraPermission()
        }
    }

    private fun initViews() {
        previewView = findViewById(R.id.preview_view)
        statusText = findViewById(R.id.status_text)
        manualButton = findViewById(R.id.manual_button)
        logoutButton = findViewById(R.id.logout_button)

        val prefs = getSharedPreferences("AssetScanner", Context.MODE_PRIVATE)
        val username = prefs.getString("username", "User")
        statusText.text = "Logged in as: $username\nReady to scan"

        manualButton.setOnClickListener {
            // TODO: Show manual entry dialog
            Toast.makeText(this, "Manual entry coming soon", Toast.LENGTH_SHORT).show()
        }

        logoutButton.setOnClickListener {
            logout()
        }
    }

    private fun checkCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestCameraPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.CAMERA),
            REQUEST_CAMERA_PERMISSION
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CAMERA_PERMISSION) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startCamera()
            } else {
                Toast.makeText(this, "Camera permission required", Toast.LENGTH_LONG).show()
                finish()
            }
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor, BarcodeAnalyzer { barcode ->
                        processBarcode(barcode)
                    })
                }

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )
            } catch (e: Exception) {
                Toast.makeText(this, "Camera error: ${e.message}", Toast.LENGTH_SHORT).show()
            }

        }, ContextCompat.getMainExecutor(this))
    }

    private fun processBarcode(barcode: String) {
        if (isProcessing) return
        isProcessing = true

        runOnUiThread {
            statusText.text = "Scanning: $barcode"
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = ApiClient.service.submitScan(ScanRequest(asset_tag = barcode))
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        statusText.text = "✓ Successfully scanned: $barcode"
                        Toast.makeText(
                            this@ScannerActivity,
                            "Asset scanned successfully",
                            Toast.LENGTH_SHORT
                        ).show()
                    } else {
                        statusText.text = "✗ Scan failed: ${response.message()}"
                        Toast.makeText(
                            this@ScannerActivity,
                            "Asset not found: $barcode",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    statusText.text = "Error: ${e.localizedMessage}"
                    Toast.makeText(
                        this@ScannerActivity,
                        "Network error: ${e.localizedMessage}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } finally {
                // Reset processing flag after delay
                Thread.sleep(2000)
                isProcessing = false
                withContext(Dispatchers.Main) {
                    statusText.text = "Ready to scan"
                }
            }
        }
    }

    private fun logout() {
        val prefs = getSharedPreferences("AssetScanner", Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        ApiClient.setAuthToken(null)
        
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }

    private class BarcodeAnalyzer(private val onBarcodeDetected: (String) -> Unit) :
        ImageAnalysis.Analyzer {
        private val scanner = BarcodeScanning.getClient()

        @androidx.camera.core.ExperimentalGetImage
        override fun analyze(imageProxy: ImageProxy) {
            val mediaImage = imageProxy.image
            if (mediaImage != null) {
                val image = InputImage.fromMediaImage(
                    mediaImage,
                    imageProxy.imageInfo.rotationDegrees
                )

                scanner.process(image)
                    .addOnSuccessListener { barcodes ->
                        for (barcode in barcodes) {
                            barcode.rawValue?.let { value ->
                                onBarcodeDetected(value)
                            }
                        }
                    }
                    .addOnCompleteListener {
                        imageProxy.close()
                    }
            } else {
                imageProxy.close()
            }
        }
    }
}
