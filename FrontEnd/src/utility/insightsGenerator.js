export class InsightsGenerator {
  constructor() {
    this.endpoint = "https://azureopeani-si.openai.azure.com";
    this.apiKey = "2eb5b7a4170349e4a9b8a78c8473a5c3";
    this.deploymentName = "gpt-4o";

    // Knowledge base (defined as a constant for reference)
    this.knowledgeBase = [
     
  {
    car_name: "Nissan Magnite",
    car_model: "MT VISIA",
    color: "Silver",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 600000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT VISIA",
    color: "White",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 600000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT VISIA+",
    color: "Blue",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 649000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT VISIA+",
    color: "Black",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 649000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT ACENTA",
    color: "Red",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 714000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT ACENTA",
    color: "Silver",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 714000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT N-CONNECTA",
    color: "Black",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 786000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT N-CONNECTA",
    color: "Blue",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 786000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT TEKNA",
    color: "Grey",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 875000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "MT TEKNA+",
    color: "Orange",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 945000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift VISIA",
    color: "White",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 700000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift VISIA",
    color: "Red",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 700000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift N-CONNECTA",
    color: "Silver",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 800000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift TEKNA+",
    color: "Blue",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 950000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift VISIA",
    color: "Blue",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 700000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift VISIA",
    color: "White",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 700000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift N-CONNECTA",
    color: "Black",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 800000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift TEKNA+",
    color: "Red",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 950000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift N-CONNECTA",
    color: "Blue",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 800000,
  },
  {
    car_name: "Nissan Magnite",
    car_model: "EZ-Shift N-CONNECTA",
    color: "White",
    fuel_type: "Petrol",
    transmission: "AMT",
    exshowroom_price: 800000,
  },
  {
    car_name: "Nissan Kicks",
    car_model: "XL",
    color: "White",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 950000,
  },
  {
    car_name: "Nissan Kicks",
    car_model: "XV",
    color: "Black",
    fuel_type: "Petrol",
    transmission: "Manual",
    exshowroom_price: 1050000,
  },
      // Add all entries from your knowledge base...
    ];
}

extractConversation(conversationLog) {
  try {
    // Get relevant messages (user messages and API responses)
    const relevantMessages = conversationLog.content.conversation
      .filter(msg => msg.type === 'user_message' || msg.type === 'api_response')
      .map(msg => {
        const role = msg.type === 'user_message' ? 'Customer' : 'Agent';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    return relevantMessages || "No conversation found.";
  } catch (error) {
    console.error("Error extracting conversation:", error);
    return "No conversation found.";
  }
}

async generateInsights(conversationLog) {
  try {
    // Extract the full conversation
    const conversationText = this.extractConversation(conversationLog);

    const response = await fetch(
      `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-05-15`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a Nissan Car Sales Expert. Based on the entire conversation between Customer and Agent, recommend the most suitable car from the knowledge base. Return ONLY a JSON object matching exactly one car from the knowledge base with these fields: {\"car_name\": \"\", \"car_model\": \"\", \"color\": \"\", \"fuel_type\": \"\", \"transmission\": \"\"}"
            },
            {
              role: "user",
              content: conversationText
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return this.knowledgeBase[0];
    }

    const data = await response.json();
    console.log("Full conversation sent to API:", conversationText); // Debug log
    
    if (!data.choices?.[0]?.message?.content) {
      return this.knowledgeBase[0];
    }

    return this.findMatchingCar(data.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error);
    return this.knowledgeBase[0];
  }
}

findMatchingCar(rawResponse) {
  try {
    console.log("Raw Response:", rawResponse);
    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}") + 1;
    const jsonString = rawResponse.substring(jsonStart, jsonEnd);
    const recommendation = JSON.parse(jsonString);

    // Find exact matching car from knowledge base
    const match = this.knowledgeBase.find(car => 
      car.car_name === recommendation.car_name &&
      car.car_model === recommendation.car_model &&
      car.color === recommendation.color &&
      car.fuel_type === recommendation.fuel_type &&
      car.transmission === recommendation.transmission
    );

    if (!match) {
      // If no exact match, try to find best match based on requirements
      const matches = this.knowledgeBase.filter(car => 
        car.car_name === recommendation.car_name &&
        car.fuel_type === recommendation.fuel_type &&
        car.transmission === recommendation.transmission
      );

      // Sort by price to get the highest spec model within budget (if mentioned)
      if (matches.length > 0) {
        return matches.reduce((prev, current) => 
          prev.exshowroom_price > current.exshowroom_price ? prev : current
        );
      }
    }

    return match || this.knowledgeBase[0];
  } catch (error) {
    console.error("Error parsing response:", error);
    return this.knowledgeBase[0];
  }
}
}