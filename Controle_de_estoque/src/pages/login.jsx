import { useState, useEffect } from 'react'
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';

import logo from '../assets/logo.png'
import '../styles/login.css'

function Login() {

  const navigate = useNavigate()
  const [Name, setName] = useState('')
  const [Password, setPassword] = useState('')
  const [PasswordView, setPasswordView] = useState(false)

  function handleLogin() {
    navigate('/dashboard')
  }

  return (
    <>
      <section>
        <div className='container'>
          <div className='containerBox'>
            <img src={logo} alt='Logo' className='logo' />
            <div className='containerInput'>
              <input
                type='text'
                placeholder='Nome'
                className='inputField'
                value={Name}
                onChange={(e) => {
                  setName(e.target.value)
                  console.log(Name)
                }}
              />
            </div>
            <div className='containerInput'>
              <input
                type= {PasswordView ? 'text' : 'password'}
                placeholder='Senha'
                className='inputField'
                value={Password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  console.log(Password)
                }}
              />
              {!PasswordView ? (
                <AiFillEyeInvisible
                  className='icon'
                  onClick={() => {
                    setPasswordView(true)
                    console.log(PasswordView)
                  }} />) :
                (<AiFillEye
                  className='icon'
                  onClick={() => {
                    setPasswordView(false)
                    console.log(PasswordView)
                  }} />)}
            </div>
            <button className='loginButton' onClick={handleLogin}>Entrar</button>
          </div>
        </div>
      </section>
    </>
  )
}

export default Login
