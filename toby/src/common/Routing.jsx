import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Instructions from '../game/instructions'
import UserWelcome from '../profile/UserWelcome'
import App from './App'
import Board from '../game/Board'
import LoginRegister from '../auth/LoginRegister'
import Lobby from '../game/Lobby'
import Partida from '../game/Partida'
import Nosotros from './Nosotros'
import Navbar from './Navbar'
import ProtectedRoute from './ProtectedRoute'

function Routing(){
    return(
        <>
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path={'/'} element={<App/>}/>
                <Route path={'/instructions'} element={<Instructions/>}/>
                <Route path={'/welcome'} element={<UserWelcome/>}/>
                <Route path={'/board'} element={<Board/>}/>
                <Route path={'/auth'} element={<LoginRegister/>}/>
                <Route path={'/register'} element={<LoginRegister defaultRegister={true}/>}/>
                <Route path={'/nosotros'} element={<Nosotros/>}/>
                <Route path={'/lobby'} element={<ProtectedRoute><Lobby/></ProtectedRoute>}/>
                <Route path={'/partida/:id'} element={<ProtectedRoute><Partida/></ProtectedRoute>}/>
            </Routes>
        </BrowserRouter>
        </>
    )
}
export default Routing