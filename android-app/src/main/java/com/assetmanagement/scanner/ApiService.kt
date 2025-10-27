package com.assetmanagement.scanner

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

data class LoginRequest(val username: String, val password: String)
data class LoginResponse(val token: String, val user: User)
data class User(val id: Int, val username: String, val role: String)

data class Asset(
    val id: Int,
    val asset_tag: String,
    val name: String,
    val description: String?,
    val category_name: String?,
    val location_name: String?,
    val serial_number: String?,
    val purchase_date: String?,
    val purchase_price: Double?,
    val condition: String,
    val status: String,
    val scans: List<Scan>?,
    val maintenance: List<Maintenance>?
)

data class Scan(
    val id: Int,
    val asset_id: Int,
    val user_id: Int?,
    val username: String?,
    val scan_type: String,
    val location_name: String?,
    val notes: String?,
    val scanned_at: String
)

data class Maintenance(
    val id: Int,
    val maintenance_type: String?,
    val description: String?,
    val cost: Double?,
    val performed_by: String?,
    val performed_at: String?
)

data class ScanRequest(
    val asset_tag: String,
    val scan_type: String = "check",
    val location_id: Int? = null,
    val notes: String? = null
)

data class ScanResponse(val id: Int, val asset_id: Int)

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("assets")
    suspend fun getAssets(@Query("search") search: String? = null): Response<List<Asset>>

    @GET("assets/{id}")
    suspend fun getAsset(@Path("id") id: Int): Response<Asset>

    @POST("scans")
    suspend fun submitScan(@Body request: ScanRequest): Response<ScanResponse>

    @GET("scans/recent")
    suspend fun getRecentScans(): Response<List<Scan>>
}

object ApiClient {
    private var baseUrl = "http://192.168.1.100:3000/api/"
    private var authToken: String? = null

    fun setBaseUrl(url: String) {
        baseUrl = if (url.endsWith("/")) url else "$url/"
    }

    fun setAuthToken(token: String?) {
        authToken = token
    }

    private fun createOkHttpClient(): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val authInterceptor = Interceptor { chain ->
            val requestBuilder = chain.request().newBuilder()
            authToken?.let {
                requestBuilder.addHeader("Authorization", "Bearer $it")
            }
            chain.proceed(requestBuilder.build())
        }

        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .build()
    }

    val service: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(createOkHttpClient())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    fun recreateService() {
        // Force recreation of service with new settings
        val field = ApiClient::class.java.getDeclaredField("service\$delegate")
        field.isAccessible = true
        field.set(null, lazy {
            Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(createOkHttpClient())
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
        })
    }
}
