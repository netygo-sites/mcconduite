<?php

	$errorMSG = "";

	// FIRSTNAME
	if (empty($_POST["fname"])) {
		$errorMSG = "First Name is required. ";
	} else {
		$fname = $_POST["fname"];
	}

	// LASTNAME
	if (empty($_POST["lname"])) {
		$errorMSG = "Last Name is required. ";
	} else {
		$lname = $_POST["lname"];
	}

	// EMAIL
	if (empty($_POST["email"])) {
		$errorMSG .= "Email is required. ";
	} else {
		$email = $_POST["email"];
	}

	// PHONE
	if (empty($_POST["phone"])) {
		$errorMSG .= "Phone is required. ";
	} else {
		$phone = $_POST["phone"];
	}

	// COURSE
	if (empty($_POST["course"])) {
		$errorMSG = "Course is required. ";
	} else {
		$course = $_POST["course"];
	}

	// DATE
	if (empty($_POST["date"])) {
		$errorMSG .= "Date is required. ";
	} else {
		$date = $_POST["date"];
	}

	$subject ='Book Appointment from site';

	$EmailTo = "info@yourdomain.com"; // Replace with your email.

	// prepare email body text
	$Body = "";
	$Body .= "fname: ";
	$Body .= $fname;
	$Body .= "\n";
	$Body .= "lname: ";
	$Body .= $lname;
	$Body .= "\n";	
	$Body .= "Email: ";
	$Body .= $email;
	$Body .= "\n";
	$Body .= "Phone: ";
	$Body .= $phone;
	$Body .= "\n";
	$Body .= "course: ";
	$Body .= $course;
	$Body .= "\n";
	$Body .= "Date: ";
	$Body .= $date;
	$Body .= "\n";

	// send email
	$success = @mail($EmailTo, $subject, $Body, "From:".$email);

	// redirect to success page
	if ($success && $errorMSG == ""){
	   echo "success";
	}else{
		if($errorMSG == ""){
			echo "Something went wrong :(";
		} else {
			echo $errorMSG;
		}
	}

?>