import {useEffect, useState, useRef} from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './Header';
import LoginPage from './components/LoginPage';
import NotepadPage from './components/NotepadPage';

/**
 * The React App that includes the Notepad Component and the Login Component
 * @returns The React Component
 */
export default function App() {

  const [ profile, setProfile ] = useState({});
  const [ signedIn, setSignedIn ] = useState(false);
  const [ title, setTitle ] = useState("");
  const [ note, setNote ] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const textareaRef = useRef(null);

  /**
   * Toggle the menu to show or hide
   */
  function toggleMenu() {
    setShowMenu(!showMenu);
  };

  /**
   * Hide the menu when the user clicks on the menu buttons
   */
  function handleMenuClick() {
      setShowMenu(false);
  };

  /**
   * Update the value of the state
   * @param {*} event Check which text component to update
   */
  function handleInputChange(event) {
    const { name, value } = event.target;
    // Check the name of the input field
    if (name === 'title') {
      setTitle(value);
    } else if (name === 'note') {
      setNote(value);
    }
  };

  /**
   * Redirect the user to the backend to sign into Facebook
   */
  async function handleFacebookLogin() {
    const backendUrl = 'http://localhost:5000';

    fetch(`${backendUrl}/api/status`)
      .then(response => {
        if (response.ok) {
          window.location.href = `http://localhost:5000/auth/facebook`;
        } else {
          alert('Unable to sign in with Google. Please try again later.')
        }
      })
      .catch(error => {
        console.error('Error while checking server status:', error);
      });
  }

  /**
   * Handle the login process for a Google user
   * @param {*} response The user's information
   * in the response after being authenticated
   */
  async function handleGoogleLogin(response) {
    let userObject = response.data;

    const id = userObject.sub;
    const first_name = userObject.given_name;
    const last_name = userObject.family_name;

    try {
      const response = await axios.get('http://localhost:5000/api/notes');
      const data = response.data;

      const foundUser = data.find(user => user.id === id);

      // Create a new user if the user does not exist
      if (!foundUser) {
        const user = {
          id: id,
          first_name: first_name,
          last_name: last_name,
          title: "",
          note: "Enter your note here",
        };
        await axios.post('http://localhost:5000/api/notes', user)
        .catch(err => {
          console.error(err);
        });
      }

      setSignedIn(true);

      // Allow the user to stay signed in with Google
      localStorage.setItem('googleAuthToken', id);

    } catch (error) {
      alert('Unable to sign in with Google. Please try again later.');
      setSignedIn(false);
      console.error('Error fetching additional user data:', error);
    }

    await axios.get('http://localhost:5000/api/notes/' + id)
      .then(res => {
        setProfile(res.data);
        setNote(res.data.note);
        setTitle(res.data.title);
      })
      .catch(err => {
        console.error(err);
      });
  }

  /**
   * Handle the logout functionality for Facebook and Google
   * Google: remove the googleAuthToken from the browser's local storage
   * Facebook: Redirect the user to the logout in the backend
   */
  function handleLogout() {
    handleMenuClick();
    const googleId = localStorage.getItem('googleAuthToken');
    if (googleId) {
      localStorage.removeItem('googleAuthToken');
    }

    const facebookId = localStorage.getItem('facebookAuthToken');
    if (facebookId) {
      window.location.href = 'http://localhost:5000/logout';
      localStorage.removeItem('facebookAuthToken');
    }
    setProfile({});
    setSignedIn(false);
  }

  /**
   * Check if a user is signed in and retrieve the notes
   * If the user does not have any notes, then store the new
   * user in the backend and create a notepad for them
   */
  useEffect(() => {
    /**
     * Get the user's notes from the backend using the user's ID
     * @param {*} id The user's ID
     * @param {*} first_name The user's first name
     * @param {*} last_name The user's last name
     */
    const getUser = async (id, first_name, last_name) => {
      try {
        const response = await axios.get('http://localhost:5000/api/notes');
        const data = response.data;

        const foundUser = data.find(user => user.id === id);

        if (!foundUser) {
          const user = {
            id: id,
            first_name: first_name,
            last_name: last_name,
            title: "",
            note: "Enter your note here",
          };
          
          await axios.post('http://localhost:5000/api/notes', user)
          .catch(err => {
            console.error(err);
          });
        }

        await axios.get('http://localhost:5000/api/notes/' + id)
        .then(res => {
          setProfile(res.data);
          setNote(res.data.note);
          setTitle(res.data.title);
        })
        .catch(err => {
          console.error(err);
        });

        } catch (error) {
          console.error('Error fetching additional user data:', error);
        }
      };

    axios.get('http://localhost:5000/api/user/profile', { withCredentials: true })
      .then((res) => {
        if (res.data) {
          const id = res.data.id;
          const first_name = res.data.name.givenName;
          const last_name = res.data.name.familyName;
          getUser(id, first_name, last_name);
          setSignedIn(true);
          localStorage.setItem('facebookAuthToken', id);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch user profile:', err);
      });

    const googleId = localStorage.getItem('googleAuthToken');
    const facebookId = localStorage.getItem('facebookAuthToken');
    
    if (googleId || facebookId) {
      const id = googleId ? googleId : facebookId;
      setSignedIn(true);

      axios.get('http://localhost:5000/api/notes/' + id)
      .then(res => {
        setProfile(res.data);
        setNote(res.data.note);
        setTitle(res.data.title);
      })
      .catch(err => {
        console.error(err);
      });
    }
  }, []);

  /**
   * Check the number of new lines in the string
   * @param {*} str The string to check
   * @returns The number of new lines in the string
   */
  function checkNewLines(str) {
    const count = str.split('\n').length - 1;
    return count;
  }

  function handleTextareaResize() {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  /**
   * Save the notes to a save file in the backend
   */
  function handleSave() {
    handleMenuClick();
    const userUpdate = {
      id: profile.id,
      note: note,
      title: title,
    };

    axios.put('http://localhost:5000/api/notes/' + profile.id, userUpdate)
      .then(res => {
        alert('Your note is saved.');
      })
      .catch(err => {
        console.error(err);
      });
  }

  return (
    <div>
      { !signedIn &&
        <LoginPage 
          handleGoogleLogin={handleGoogleLogin}
          handleFacebookLogin={handleFacebookLogin}
        />
      }
      { signedIn &&
      <div>
        <Header
          handleSave={handleSave}
          handleSignOut={handleLogout}
          toggleMenu={toggleMenu}
          showMenu={showMenu}
          signedIn={signedIn}
          name={profile.first_name}
        />
        <NotepadPage 
          title={title}
          note={note}
          setTitle={setTitle}
          setNote={setNote}
          textareaRef={textareaRef}
          handleInputChange={handleInputChange}
          handleTextareaResize={handleTextareaResize}
          checkNewLines={checkNewLines}
        />
      </div>
      }
    </div>
  );
}
