import Path from "./path.jsx"
import {Welcome} from "../components/Welcome.jsx"
import {Voting} from "../components/Voting.jsx"

const routes = [
    { path: Path.WELCOME, element: <Welcome /> },
    { path: Path.VOTING, element: <Voting /> },
]

export default routes
