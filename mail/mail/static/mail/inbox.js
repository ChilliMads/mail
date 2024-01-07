document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  // Send an email
  document.querySelector('#send-email').addEventListener('click', sendingEmail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() { 

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-details').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function sendingEmail() {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details').style.display = 'none';

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  const sender = document.querySelector('#compose-sender').value;
  
  // In the fetch we send the email and we convert the response to JSON format and we log the result to the console.
  fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          sender: sender,
          recipients: recipients,
          subject: subject,
          body: body
      })
  }).then(response => response.json()) // We convert the response to JSON format here
      .then(result => {
          console.log(result);
      });
      load_mailbox('Sent'); 
}

function load_mailbox(mailbox) { // Here we load the mailbox 
  // Show the mailbox and hide other views 
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-details').style.display = 'none';
    document.querySelector('#heading').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`; // Here we set the heading to the mailbox name
    document.querySelector('#emails-preview').innerHTML = '';
    console.log(`Requesting emails from ${mailbox}...`); // Here we log the mailbox name to the console

  fetch(`/emails/${mailbox}`) // Here we fetch the emails
  .then(response => response.json()) // We convert the response to JSON fomat
  .then(emails => { 
      // Add emails to the mailbox and we create a new email item for each email where we add the sender, recipients, subject and timestamp to the item with the innerHTML property.
      emails.forEach(email => {
        const item = document.createElement('tr'); 
        item.innerHTML = `<td class="sender">${email.sender}</td><td class="recipients">${email.recipients}</td><td class="subject">${email.subject}</td><td class="timestamp">${email.timestamp}</td>`;
          item.style.backgroundColor = email.read ? '#D3D3D3' : '#FFFFFF'; // Change the color to grey if it is read - otherwise it will be white. 
                                                //D3D3D3 is the hexadecimal code for grey and FFFFFF is the hexadecimal code for white. 

          // I add a click event listener, to view the email details and mark the email as read by changing the background color
          item.addEventListener('click', () => { 
              fetch(`/emails/${email.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                      read: true
                  }) 
              }).then(() => {
                  item.style.backgroundColor = '#D3D3D3'; 
                  detailsEmail(email.id); // Here we call the function to view the email details
              });
          });
          document.querySelector('#emails-preview').appendChild(item);
      });
  });
}

// In this function we add a view to view the email details where we see sender, recipients, subject, timestamp, and body.
function detailsEmail(id) {
  Toggle_Views();

  // Here we create elements for displaying email details
  const info = document.createElement('p');
  const replyButton = createButton('Reply', 'btn btn-sm btn-outline-primary');
  const archiveButton = createButton('', 'btn btn-sm btn-outline-primary', '6px');
  const emailBody = document.createElement('a');
  info.className = 'email-info';

  // We clear out the previous email details and we fetch and display the email details
  const emailDetailsContainer = document.querySelector('#email-details');
  emailDetailsContainer.innerHTML = '';
  
  Emaildetailsfetch(id, replyButton, archiveButton, info, emailBody, emailDetailsContainer)
  markEmail_Read(id);// Mark the email as read
}
function Toggle_Views() { // Here i have add a function to hide other views and show email details view
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-details').style.display = 'block';
}

function createButton(text, className, marginLeft = '0') { // Here we create a button with the given text and class name and margin left
    const button = document.createElement('button');
    button.innerHTML = text;
    button.className = className; 
    button.style.marginLeft = marginLeft;
    return button;
}
// Here we fetch the email details and we display the email details
function Emaildetailsfetch(id, replyButton, archiveButton, info, emailBody, container) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      setupEmailActions(email, replyButton, archiveButton); // Here we setup the email actions by calling the function setupEmailActions
      ShowEmailInfo(email, info, emailBody); //  we display the email details by calling the function ShowEmailInfo
      ElementstoContainer([info, replyButton, archiveButton, emailBody], container); // Here we add the elements to the container by calling the function ElementstoContainer
    });
}

// In this function we setup the email actions, where we have the reply and archive button
function setupEmailActions(email, replyButton, archiveButton) { 
  replyButton.addEventListener('click', () => replyToEmail(email.id)); // Here we add a click event listener to the reply button
  archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
  archiveButton.addEventListener('click', () => archive_email(email.id, email.archived)); // Here we add a click event listener to the archive button
}
// In this function we display the email details with the sender, recipients, subject, timestamp, and body in a innerHTML property
function ShowEmailInfo(email, info, emailBody) {
  info.innerHTML = `<p><b>From:</b> ${email.sender}<br><b>To:</b> ${email.recipients}<br><b>Subject:</b> ${email.subject}<br><b>Timestamp:</b> ${email.timestamp}</p>`; //innerHTML property
  emailBody.innerHTML = `<hr>${email.body}`;
}

function ElementstoContainer(elements, container) { // Here we add the elements to the container 
  elements.forEach(element => container.appendChild(element)); 
}

function markEmail_Read(id) { // Here we mark the email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ read: true })
  });
}
// This function is where i have the reply function, where we can reply to a specific email and then update the user interface based on the result of this operation.
function replyToEmail(emailId) {
  compose_email();
  // Here we fetch the email with the given id
  fetch(`/emails/${emailId}`)
    .then(response => response.json())
    .then(email => {
      // We set the sender to the recipient of the original email and we set the subject to "Re: " + the original subject and we prepare and set the reply body
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = Subject_format(email.subject);
      document.querySelector('#compose-body').value = ReplyBody(email);
    })
    //catch error if any
    .catch(error => {
      console.error('Error fetching email:', error);
    });
}
// Here i made two functions to format the subject and the reply body
function Subject_format(subject) {
  const subjectPrefix = 'RE: ';
  return subject.startsWith(subjectPrefix) ? subject : `${subjectPrefix}${subject}`;
}
function ReplyBody(email) {
  return `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
}
// This function is where we have the archive function, where we can change the archiving status of a specific email and then update the user interface based on the result of this operation.
function archive_email(id, isArchived) {
  fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: !isArchived
      })
  })
  // We check if the response is okay, and if it is we than we load the mailbox, if not we log an error.
  .then(response => {  
    if (response.ok) {
      load_mailbox('inbox');
    } else {
      
      console.error('Error:');
    }
  })
  .catch(error => console.error('Error:', error)); 
}

