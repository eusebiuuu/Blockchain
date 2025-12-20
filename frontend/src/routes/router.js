import React from "react"

import Path from "./path"
import {Welcome} from "../components/Welcome.js"
import {Catalog} from "../components/Catalog"

const routes = [
    { path: Path.WELCOME, element: <Welcome /> },
    { path: Path.CATALOG, element: <Catalog /> },
    { path: Path.HOME, element: <Welcome /> },

]

export default routes