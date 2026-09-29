package com.campusconnect.studentapp

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.campusconnect.studentapp.model.SingleStudentResponse
import com.campusconnect.studentapp.model.Student
import com.campusconnect.studentapp.network.RetrofitClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class AddStudentActivity : AppCompatActivity() {

    private lateinit var etName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etCourse: EditText
    private lateinit var etSemester: EditText
    private lateinit var btnSubmit: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_student)

        etName = findViewById(R.id.etStudentName)
        etEmail = findViewById(R.id.etStudentEmail)
        etCourse = findViewById(R.id.etStudentCourse)
        etSemester = findViewById(R.id.etStudentSemester)
        btnSubmit = findViewById(R.id.btnSubmitStudent)

        btnSubmit.setOnClickListener {
            val name = etName.text.toString().trim()
            val email = etEmail.text.toString().trim()
            val course = etCourse.text.toString().trim()
            val semStr = etSemester.text.toString().trim()

            // Basic client-side validation
            if (name.isEmpty()) {
                etName.error = "Name is required"
                return@setOnClickListener
            }
            if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                etEmail.error = "Valid email is required"
                return@setOnClickListener
            }
            if (course.isEmpty()) {
                etCourse.error = "Course is required"
                return@setOnClickListener
            }
            val semester = semStr.toIntOrNull()
            if (semester == null || semester < 1 || semester > 12) {
                etSemester.error = "Semester must be between 1 and 12"
                return@setOnClickListener
            }

            val student = Student(
                name = name,
                email = email,
                course = course,
                semester = semester
            )

            btnSubmit.isEnabled = false
            btnSubmit.text = "Submitting..."

            RetrofitClient.instance.createStudent(student).enqueue(object : Callback<SingleStudentResponse> {
                override fun onResponse(call: Call<SingleStudentResponse>, response: Response<SingleStudentResponse>) {
                    btnSubmit.isEnabled = true
                    btnSubmit.text = "Create Student"

                    if (response.isSuccessful) {
                        Toast.makeText(this@AddStudentActivity, "Student created successfully! (201 Created)", Toast.LENGTH_SHORT).show()
                        finish()
                    } else if (response.code() == 400) {
                        Toast.makeText(this@AddStudentActivity, "Validation error (400): Check inputs or duplicate email", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this@AddStudentActivity, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<SingleStudentResponse>, t: Throwable) {
                    btnSubmit.isEnabled = true
                    btnSubmit.text = "Create Student"
                    Toast.makeText(this@AddStudentActivity, "Network Error: ${t.message}", Toast.LENGTH_LONG).show()
                }
            })
        }
    }
}
