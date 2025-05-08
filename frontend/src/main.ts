import './style.css'
import googleLogo from '/assets/google.svg'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Garlic Phone</h1>

  <section class="login">
    <form class="login-form">
      <h3 class="login-heading">Sign Up</h3>
      <button id="google-login-button" class="login-google-button">
          <p class="login-google-button-text">Login With Google</p>
          <img class="login-google-image" src="${googleLogo}"/></button>
    </form>
  </section>
`