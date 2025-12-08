import Path from "./path.jsx"
import {Welcome} from "../components/Welcome.jsx"
import {Voting} from "../components/Voting.jsx"
import {ProjectForm} from "../components/ProjectForm.jsx"
import {Form} from "react-router-dom";

const routes = [
    { path: Path.WELCOME, element: <Welcome /> },
    { path: Path.VOTING, element: <Voting /> },
    { path: Path.FORM, element: <ProjectForm /> },
]

export default routes
