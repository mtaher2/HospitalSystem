function showAlert(message, type) {
    // Create a div element for the alert message
    const alertDiv = document.createElement("div");
    alertDiv.classList.add("alert");
    alertDiv.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
    alertDiv.textContent = message;
  
    // Append the alert to the body or a specific container
    document.body.appendChild(alertDiv);
  
    // Set timeout to remove the alert after 5 seconds for success or 7 seconds for error
    setTimeout(() => {
      alertDiv.remove();
    }, type === 'success' ? 5000 : 7000); // 5000ms = 5 seconds, 7000ms = 7 seconds
  }

  

  export default showAlert;