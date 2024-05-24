const VF_API_TOKEN = "<VF_API_TOKEN>";
const PROJECT_ID = "<VF_PROEJCT_ID>";
let USER_ID;

document.getElementById('contactForm').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent the form from submitting normally
  searchKnowledgeBase();
});

function generateUniqueId() {
  const timestamp = Date.now().toString(36); // Convert timestamp to a base-36 string
  const randomNumber = Math.random().toString(36).substring(2, 9); // Generate a random base-36 string
  return `${timestamp}-${randomNumber}`;
}

USER_ID = generateUniqueId();

async function launchNewSearch() {
  let body = JSON.stringify({
    "action": {
      "type": "launch"
    }
  });

  let config = {
    method: 'POST',
    url: `https://general-runtime.voiceflow.com/state/user/${USER_ID}/interact`,
    headers: {
      'versionID': 'development',
      'Authorization': VF_API_TOKEN,
      'Content-Type': 'application/json'
    },
    data: body
  };

  try {
    const response = await axios.request(config);
    // const data = await response.data;
    // console.log(data);

  } catch (error) {
    console.error('Error fetching data from API:', error);
    // responseContainer.innerHTML = '<p>There was an error processing your request.</p>';
  }
}

async function patchVariables(email, firstName) {

  let body = JSON.stringify({
    "userEmail": email || 0,
    "userFirstname": firstName || 0,
    "languageCode": "en"
  });

  let config = {
    method: 'PATCH',
    url: `https://general-runtime.voiceflow.com/state/user/${USER_ID}/variables`,
    headers: {
      'versionID': 'development',
      'Authorization': VF_API_TOKEN,
      'Content-Type': 'application/json'
    },
    data: body
  };

  try {
    const response = await axios.request(config);
    // const data = await response.data;
    // console.log(data);

  } catch (error) {
    console.error('Error updating variables:', error);
  }
}

async function submitFeedback(yesOrNo) {

  let intentName = "submit_feedback_negative";

  if (yesOrNo.toLowerCase() === "yes") {
    intentName = "submit_feedback_positive";
  }

  let body = JSON.stringify({
    "action": {
      "type": "intent",
      "payload": {
        "intent": {
          "name": intentName
        },
        "query": "",
        "entities": []
      }
    }
  });

  let config = {
    method: 'POST',
    url: `https://general-runtime.voiceflow.com/state/user/${USER_ID}/interact`,
    headers: {
      'versionID': 'development',
      'Authorization': VF_API_TOKEN,
      'Content-Type': 'application/json'
    },
    data: body
  };

  try {
    const response = await axios.request(config);
    // const data = await response.data;
    // console.log(data);

  } catch (error) {
    console.error('Error updating variables:', error);
  }
}

async function createTranscript(email, firstName) {

  let body = JSON.stringify({
    "projectID": PROJECT_ID,
    "versionID": "development",
    "sessionID": USER_ID,
    "user": {
      "name": email || firstName || "GUEST_USER"
    },
    // "device": "string",
    // "os": "string",
    // "browser": "string"
  });

  let config = {
    method: 'PUT',
    url: `https://api.voiceflow.com/v2/transcripts`,
    headers: {
      'versionID': 'development',
      'Authorization': VF_API_TOKEN,
      'Content-Type': 'application/json'
    },
    data: body
  };

  try {
    const response = await axios.request(config);
    const data = await response.data;
    console.log(data);

  } catch (error) {
    console.error('Error updating variables:', error);
  }
}

async function searchKnowledgeBase() {
  const email = document.getElementById('email').value;
  const firstName = document.getElementById('firstName').value;

  const responseContainer = document.getElementById('responseContainer');
  responseContainer.innerHTML = ''; // Clear previous response
  loadingSpinner.style.display = 'block'; // Show the loading spinner

  await launchNewSearch();
  await patchVariables(email, firstName);

  let message = document.getElementById('message').value;

  let body = JSON.stringify({
    "action": {
      "type": "text",
      "payload": message
    }
  });

  let config = {
    method: 'POST',
    url: `https://general-runtime.voiceflow.com/state/user/${USER_ID}/interact`,
    headers: {
      'versionID': 'development',
      'Authorization': VF_API_TOKEN,
      'Content-Type': 'application/json'
    },
    data: body
  };

  try {
    const response = await axios.request(config);
    const data = await response.data;
    loadingSpinner.style.display = 'none'; // Hide the loading spinner

    const ticketSubmittedTrace = data.filter(item => item.type === 'ticket_submitted');
    if (ticketSubmittedTrace.length > 0) {
      responseContainer.innerHTML = `<p>${ticketSubmittedTrace[0].payload}</p>` || '<p>Your ticket has been submitted.</p>';
      return;
    }

    const questionElement = document.createElement('p');
    questionElement.innerHTML = '<h3>Does the following answer your inquiry?</h3>';
    responseContainer.appendChild(questionElement);

    data.forEach(item => {
      if (item.type === 'text' && item.payload && item.payload.message) {
        const message = item.payload.message;
        const messageElement = document.createElement('div');
        messageElement.innerHTML = marked.parse(message);
        responseContainer.appendChild(messageElement);
      }
      if (item.type === 'end') {
        createTranscript(email, firstName);
      }
    });

    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes';
    yesButton.onclick = () => {
      const feedbackMessage = document.createElement('p');
      feedbackMessage.textContent = 'Thank you for your feedback!';
      responseContainer.appendChild(feedbackMessage);
      submitFeedback("yes");
    };

    const noButton = document.createElement('button');
    noButton.textContent = 'No, submit my ticket';
    noButton.onclick = () => {
      const feedbackMessage = document.createElement('p');
      feedbackMessage.textContent = 'Your ticket has been submitted. We will get back to you shortly.';
      responseContainer.appendChild(feedbackMessage);
      submitFeedback("no");
    };

    responseContainer.appendChild(yesButton);
    responseContainer.appendChild(noButton);
  } catch (error) {
    console.error('Error fetching data from API:', error);
    loadingSpinner.style.display = 'none'; // Hide the loading spinner
    responseContainer.innerHTML = '<p>There was an error processing your request.</p>';
  }
}