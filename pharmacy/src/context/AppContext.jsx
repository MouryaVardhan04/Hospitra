import { createContext } from "react";

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currency = import.meta.env.VITE_CURRENCY || '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const value = {
        backendUrl,
        currency,
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider