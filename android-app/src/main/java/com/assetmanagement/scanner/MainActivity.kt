package com.assetmanagement.scanner

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var usernameInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var serverUrlInput: EditText
    private lateinit var loginButton: Button
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        loadSavedSettings()
        checkExistingLogin()
    }

    private fun initViews() {
        usernameInput = findViewById(R.id.username_input)
        passwordInput = findViewById(R.id.password_input)
        serverUrlInput = findViewById(R.id.server_url_input)
        loginButton = findViewById(R.id.login_button)
        progressBar = findViewById(R.id.progress_bar)

        loginButton.setOnClickListener {
            attemptLogin()
        }
    }

    private fun loadSavedSettings() {
        val prefs = getSharedPreferences("AssetScanner", Context.MODE_PRIVATE)
        val savedUrl = prefs.getString("server_url", "http://192.168.1.100:3000/api")
        serverUrlInput.setText(savedUrl)
    }

    private fun checkExistingLogin() {
        val prefs = getSharedPreferences("AssetScanner", Context.MODE_PRIVATE)
        val token = prefs.getString("auth_token", null)
        
        if (token != null) {
            ApiClient.setAuthToken(token)
            navigateToScanner()
        }
    }

    private fun attemptLogin() {
        val username = usernameInput.text.toString().trim()
        val password = passwordInput.text.toString().trim()
        val serverUrl = serverUrlInput.text.toString().trim()

        if (username.isEmpty() || password.isEmpty() || serverUrl.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            return
        }

        setLoading(true)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                ApiClient.setBaseUrl(serverUrl)
                ApiClient.recreateService()
                
                val response = ApiClient.service.login(LoginRequest(username, password))
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && response.body() != null) {
                        val loginResponse = response.body()!!
                        saveLoginInfo(serverUrl, loginResponse.token, loginResponse.user)
                        navigateToScanner()
                    } else {
                        Toast.makeText(
                            this@MainActivity,
                            "Login failed: ${response.message()}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                    setLoading(false)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@MainActivity,
                        "Error: ${e.localizedMessage}",
                        Toast.LENGTH_LONG
                    ).show()
                    setLoading(false)
                }
            }
        }
    }

    private fun saveLoginInfo(serverUrl: String, token: String, user: User) {
        val prefs = getSharedPreferences("AssetScanner", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("server_url", serverUrl)
            putString("auth_token", token)
            putString("username", user.username)
            putInt("user_id", user.id)
            apply()
        }
        ApiClient.setAuthToken(token)
    }

    private fun navigateToScanner() {
        val intent = Intent(this, ScannerActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    private fun setLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        loginButton.isEnabled = !loading
        usernameInput.isEnabled = !loading
        passwordInput.isEnabled = !loading
        serverUrlInput.isEnabled = !loading
    }
}
