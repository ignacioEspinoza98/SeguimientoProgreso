const LogueadoLocalStorage = JSON.parse(localStorage.getItem("Logueado"));

if(!LogueadoLocalStorage){
    window.location.href = "../../index.html";
}