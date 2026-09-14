/** Clé de stockage du thème choisi (clair / sombre) ; absente = préférence système. */
export const THEME_KEY = "poketracker-theme";

/** Script inline placé dans <head> : réapplique le thème mémorisé avant le premier rendu, sans flash. */
export const themeBootScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
