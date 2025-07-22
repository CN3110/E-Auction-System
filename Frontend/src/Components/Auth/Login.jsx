import React, { useState } from 'react';
import Alert from '../Common/Alert';
import Footer from '../Common/Footer';
import '../../styles/auth.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    userId: '',
    password: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
  };

  return (
    <>
  <div className="login-page">
    <div className="login-form">
          <h2>
            Login to <br /> E-Auction System
            <br /> Anunine Holdings Pvt Ltd
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>User ID</label>
              <input 
                type="text" 
                value={credentials.userId}
                onChange={(e) => setCredentials({ ...credentials, userId: e.target.value })}
                placeholder="Enter your User ID" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter your password" 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
          {alert.show && <Alert message={alert.message} type={alert.type} />}
       </div>
        <Footer />
  </div>
 
</>
  );
};

export default Login;
