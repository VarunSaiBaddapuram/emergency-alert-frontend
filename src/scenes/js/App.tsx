import React from "react";
import Weather from "./Weather";

interface FloodPredictProps {
  lat: number;
  lon: number;
}

const FloodPredict: React.FC<FloodPredictProps> = ({ lat, lon }) => {
  return (
    <div className="App">
      <div className="container p-0">
        <Weather lat={lat} lon={lon} />
      </div>
    </div>
  );
};

export default FloodPredict;
