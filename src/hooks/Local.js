import { useState, useEffect, use } from "react";

export const Local = (key, initialValue) => {
    const [value, setValue] = useState(() => {
        try{
            const item= window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;

        } catch (error){
            console.error("Error leyendo desde el almacenamiento local", error);
            return initialValue;
        }
    });

    useEffect(() => {
        try{
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error){
            console.error("Error guardando en el almacenamiento local", error);
        }
    }, [key, value]);

    return [value, setValue];
};
