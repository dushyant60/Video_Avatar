import React from "react";
import "../index.css";
import VideoRes from "./Video_Res";

const HomePage = () => {
  return (
    <div style={{position: "relative"}}>
      <header class="header">
        <img src="../fav1.png" alt="Logo" />
        <div class="social-media">
          <img src="../nissanlogo.png" alt="Nissan Logo" />
        </div>
      </header>

      <section class="home">
        <div class="home-content">
          <h1>Car Buying Experience.</h1>
          <h3>Redefined!</h3>
          <p>
            Explore our innovative car buying platform that brings you closer
            to your dream car with cutting-edge 3D models, precise image
            detection, and a smart AI sales agent. Discover, interact, and
            purchase with ease, as we revolutionize the way you experience car
            shopping.
          </p>
          <a href="#features" class="card-btn">
            Know More
          </a>
        </div>

        <div class="home-img">
          <div class="rhombus">
            <img src="../car.png" alt="Car" />
          </div>
        </div>

        <div class="rhombus2"></div>
      </section>

      <section id="features" class="features">
        <h2>Solutions</h2>
        <div class="card-container">
          <div class="card">
            <div class="card-content">
              <img
src="../TestDrive.png"     
style={{width:"100%", backgroundPosition:"center", backgroundSize:"cover"}}

              ></img>
              <h3>Book Test Drive</h3>
              <p>
                Get real-time detection and information about car parts during
                a live video session. Our experts will guide you through the
                parts and answer your queries.
              </p>
              <a href="pages/solutions.html#live-video" class="card-btn">
                Learn More
              </a>
            </div>
          </div>
          <div class="card">
            <div class="card-content">
              <img
                src="../BookCar.png"
                style={{width:"100%", backgroundPosition:"center", backgroundSize:"cover"}}

              ></img>
              <h3>Book Car</h3>
              <p>
                Use our interactive 3D model to explore and identify car parts.
                Simply click on a part to get detailed information and answers
                to common questions.
              </p>
              <a href="pages/solutions.html#3d-model" class="card-btn">
                Learn More
              </a>
            </div>
          </div>
          <div class="card">
            <div class="card-content">
              <img
                src="../Dealer.png"
                style={{width:"100%", backgroundPosition:"center", backgroundSize:"cover"}}
              ></img>
              <h3>Dealers Page</h3>
              <p>
                Upload or take a picture of your car, and our system will
                identify and provide details about the visible parts, helping
                you learn more about each component.
              </p>
              <a href="pages/solutions.html#image-detection" class="card-btn">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>
      <VideoRes/>
    </div>
  );
};

export default HomePage;
