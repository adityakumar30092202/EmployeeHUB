import axios from 'axios'
import React, { useEffect, useState } from 'react'

import './App.css'

function Home() {

  const [adminCount, setAdminCount] = useState(0); // Initialize with 0
  const [employeeCount, setEmployeeCount] = useState(0); // Initialize with 0
  const [salary, setSalary] = useState(0); // Initialize with 0
  const [adminList, setAdminList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/adminCount')
      .then(res => {
        setAdminCount(res.data[0].admin || 0); // Set default value to 0 if data is undefined
      }).catch(err => console.log(err));

    axios.get('http://localhost:8000/employeeCount')
      .then(res => {
        setEmployeeCount(res.data[0].employee || 0); // Set default value to 0 if data is undefined
      }).catch(err => console.log(err));

    axios.get('http://localhost:8000/salary')
      .then(res => {
        setSalary(res.data[0].sumOfSalary || 0); // Set default value to 0 if data is undefined
      }).catch(err => console.log(err));

    axios.get('http://localhost:8000/adminList')
      .then(res => {
        setAdminList(res.data || []); // Set default value to an empty array if data is undefined
        setIsLoading(false);
      }).catch(err => {
        console.log(err);
        setIsLoading(false);
      });

  }, []);
  return (
    <div className='custom1-bg'>
      <div>
        <div className='p-3 d-flex justify-content-around'>
          <div className='px-3 pt-2 pb-3 border shadow-sm w-25'>
            <div className='text-center pb-1'>
              <h4>Admin</h4>
            </div>
            <hr />
            <div className=''>
              <h5>Total: {adminCount}</h5>
            </div>
          </div>
          <div className='px-3 pt-2 pb-3 border shadow-sm w-25'>
            <div className='text-center pb-1'>
              <h4>Employee</h4>
            </div>
            <hr />
            <div className=''>
              <h5>Total: {employeeCount}</h5>
            </div>
          </div>
          <div className='px-3 pt-2 pb-3 border shadow-sm w-25'>
            <div className='text-center pb-1'>
              <h4>Salary</h4>
            </div>
            <hr />
            <div className=''>
              <h5>Total: {salary}</h5>
            </div>
          </div>
        </div>

        {/* admin list is... */}
        <div className='mt-4 px-5 pt-3'>
          <h3>List of Admins</h3>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <table className='table'>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {adminList.map((admin, index) => (
                  <tr key={index}>
                    <td>{admin.Email}</td>
                    <td> {<button>Contact</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home
