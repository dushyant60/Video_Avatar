import React, { useState } from "react";
import "../index.css";
import Video_Res from "./Video_Res";
import { Avatar } from "./Avatar";


const HomePage = () => {


  return (
    <div style={{ position: "relative" }}>
      <header className="header">
        <img src="../fav1.png" alt="Logo" />
        <div className="social-media">
          <img src="../nissanlogo.png" alt="Nissan Logo" />
        </div>
      </header>

      <section className="home">
        <div className="home-content">
          <h1>Car Buying Experience.</h1>
          <h3>Redefined!</h3>
          <p>
            Explore our innovative car buying platform that brings you closer
            to your dream car with cutting-edge 3D models, precise image
            detection, and a smart AI sales agent. Discover, interact, and
            purchase with ease, as we revolutionize the way you experience car
            shopping.
          </p>
          <a href="#features" className="card-btn">
            Know More
          </a>
        </div>
        <div className="home-img">
          <div className="rhombus">
            <img src="../car.png" alt="Car" />
          </div>
        </div>
        <div className="rhombus2"></div>
      </section>

      <section id="features" className="features">
        <h2>Solutions</h2>
        <div className="card-container">
          {/* Card 1 */}
          <div className="card">
            <div className="card-content">
              <img
                src="../TestDrive.png"
                style={{
                  width: "100%",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
              <h3>Book Test Drive</h3>
              <p>
              Schedule a personalized test drive experience with ease. Connect with our team for guidance and ensure a smooth booking process. Click below to get started.
              </p>
              <a href="https://cartestdrive-c9aqduaxd7hddkap.centralindia-01.azurewebsites.net/ride" className="card-btn" target="_blank" rel="noopener noreferrer">
                Learn More
              </a>
            </div>
          </div>
          {/* Card 2 */}
          <div className="card">
            <div className="card-content">
              <img
                src="../BookCar.png"
                style={{
                  width: "100%",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
              <h3>Book Car</h3>
              <p>
              Easily reserve your desired car online. Follow a simple process to book your car at your convenience. Click below to proceed.
              </p>
              <a href="https://cartestdrive-c9aqduaxd7hddkap.centralindia-01.azurewebsites.net/bookcar" className="card-btn" target="_blank" rel="noopener noreferrer">
                Learn More
              </a>
            </div>
          </div>
          {/* Card 3 */}
          <div className="card">
            <div className="card-content">
              <img
                src="../Dealer.png"
                style={{
                  width: "100%",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
              <h3>Dealers Page</h3>
              <p>
              Dealers can now manage everything in one place, streamlining processes for better efficiency. Click below to learn more.
              </p>
              <a className="card-btn" style={{ backgroundColor: "#ccc", cursor: "not-allowed" }}>
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* <Avatar/> */}
<Video_Res/>

    </div>
  );
};

export default HomePage;