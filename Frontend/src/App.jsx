import React from 'react'
import {Route, Routes} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './Components/Auth/Login';
import AdminDashboard from './Components/Admin/AdminDashboard';
import BidderDashboard from './Components/Bidder/BidderDashboard';

const App = () => {
  return (
    <div className='app'>
        <Routes>
            < Route path='/admindashboard' element={<AdminDashboard/>}/>
            <Route path='/bidderdashboard' element={<BidderDashboard/>}/>
            <Route path='/' element={<Login/>}/>

        </Routes>

    </div>
  )
}

export default App