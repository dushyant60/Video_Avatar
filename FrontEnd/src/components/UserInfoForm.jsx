import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UserInfoForm.css";

export const UserInfoForm = ({ onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [location, setLocation] = useState({
    latitude: "",
    longitude: "",
    address: "",
  });

  const [locationError, setLocationError] = useState("");
  const [submitStatus, setSubmitStatus] = useState(""); // To display success/error messages

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchLocationName = async (lat, lon) => {
    try {
      const apiKey = "5bEdYZKYd8UuQ7yAa0VpZvwPc4XFwOGHos1MOYe3"; // Replace with your actual API key
      const response = await axios.get("https://api.olamaps.io/places/v1/reverse-geocode", {
        params: {
          latlng: `${lat},${lon}`,
          language: "en",
          api_key: apiKey,
        },
      });

      const results = response.data.results;
      if (results.length > 0) {
        const locationName = results[0].formatted_address;
        setLocation((prevLocation) => ({
          ...prevLocation,
          address: locationName,
        }));
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
      setLocationError("Unable to fetch address. Please try again.");
    }
  };

  const showPosition = (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    setLocation((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon,
    }));
    fetchLocationName(lat, lon);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, handleError);
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  };

  const handleError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationError("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        setLocationError("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        setLocationError("The request to get user location timed out.");
        break;
      default:
        setLocationError("An unknown error occurred.");
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = { ...formData, location };
  
    // try {
    //   // Attempt to send the data to the API
    //   const response = await axios.post(
    //     "https://ddf5-49-36-183-140.ngrok-free.app/register-user",
    //     dataToSend
    //   );
    //   setSubmitStatus("User registered successfully!");
    //   console.log("Response:", response.data);
    // } catch (error) {
    //   if (error.response) {
    //     const { status, data } = error.response;
  
    //     if (
    //       status === 400 &&
    //       data.message &&
    //       data.message.includes("User with this mobile number or email already exists")
    //     ) {
    //       // Duplicate entry detected, log and move forward with the avatar flow
    //       console.warn("Duplicate entry detected, proceeding with the avatar flow.");
    //       setSubmitStatus("Duplicate entry. Proceeding with existing data.");
    //     } else {
    //       // Handle other errors
    //       console.error("Error submitting form:", error);
    //       setSubmitStatus("Failed to register user. Please try again.");
    //       return; // Exit if there's a real error
    //     }
    //   } else {
    //     // Handle case where there's no response from the server
    //     console.error("Error submitting form:", error);
    //     setSubmitStatus("Failed to register user. Please try again.");
    //     return;
    //   }
    // }
  
    // Proceed with the avatar flow regardless of whether the user is new or existing
    onSave(dataToSend);
  };

  return (
    <form className="user-info-form" onSubmit={handleSubmit}>
      <h3 style={{ color: "white" }}>Please Enter Your Details</h3>
      <label>
        Name:
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Email:
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Phone:
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          required
        />
      </label>
      <button type="submit">Submit</button>
      {submitStatus && <p style={{ color: "white" }}>{submitStatus}</p>}
      {locationError && <p style={{ color: "red" }}>{locationError}</p>}
    </form>
  );
};
