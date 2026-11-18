import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Login from "../paginas/Login";
import Perfil from "../paginas/Perfil";
import FeedInicio from "../paginas/FeedInicio";
import Configuracao from "../paginas/Configuracao";
import PublicarFoto from "../paginas/Foto";
import Cadastro from "../paginas/Cadastro";

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
        path: "/cadastro",
        element: <Cadastro />,
    },

    {
        path: "/feed/:id",
        element: <FeedInicio />,
    },

      {
        path: "/configuracao/:id",
        element: <Configuracao />,
    },

    {
        path: "/publicar/:id",
        element: <PublicarFoto />,
    },
]);

export default function Rotas() {
    return <RouterProvider router={rotas} />;
}
