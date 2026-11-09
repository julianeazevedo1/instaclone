import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Login from "../paginas/Login";
import Perfil from "../paginas/Perfil";
import Feed from "../componentes/Feed";
import Configuracao from "../paginas/Configuracao";

const rotas = createBrowserRouter([


    {
        path: "/",
        element: <Navigate to="/login" replace />,
    },

    {
        path: "/perfil/:id",
        element: <Perfil />,
    },
    
    {
        path: "/login",
        element: <Login />,
    },

    {
        path: "/feed",
        element: <Feed />,
    },

      {
        path: "/configuracao/:id",
        element: <Configuracao />,
    },
]);

export default function Rotas() {
    return <RouterProvider router={rotas} />;
}
