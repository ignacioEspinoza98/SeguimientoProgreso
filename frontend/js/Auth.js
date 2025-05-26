const UsuarioLocalStorage = JSON.parse(localStorage.getItem("Usuario"));

if(!UsuarioLocalStorage){
    window.location.href = "../../index.html";
}