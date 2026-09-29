package com.campusconnect.studentapp.model

import com.google.gson.annotations.SerializedName

data class Student(
    @SerializedName("id") val id: Int? = null,
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("course") val course: String,
    @SerializedName("semester") val semester: Int
)

data class StudentResponse(
    @SerializedName("status") val status: String,
    @SerializedName("count") val count: Int? = null,
    @SerializedName("data") val data: List<Student>? = null,
    @SerializedName("message") val message: String? = null
)

data class SingleStudentResponse(
    @SerializedName("status") val status: String,
    @SerializedName("data") val data: Student? = null,
    @SerializedName("message") val message: String? = null
)
