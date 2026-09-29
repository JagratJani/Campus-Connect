package com.campusconnect.studentapp.network

import com.campusconnect.studentapp.model.SingleStudentResponse
import com.campusconnect.studentapp.model.Student
import com.campusconnect.studentapp.model.StudentResponse
import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface StudentApiService {
    @GET("students")
    fun getAllStudents(): Call<StudentResponse>

    @GET("students/{id}")
    fun getStudentById(@Path("id") id: Int): Call<SingleStudentResponse>

    @POST("students")
    fun createStudent(@Body student: Student): Call<SingleStudentResponse>
}

object RetrofitClient {
    // 10.0.2.2 points to localhost of your development PC from the Android Emulator
    private const val BASE_URL = "http://10.0.2.2:3000/"

    val instance: StudentApiService by lazy {
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        retrofit.create(StudentApiService::class.java)
    }
}
