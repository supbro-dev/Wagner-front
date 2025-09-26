import React from 'react';
import EmployeeEfficiency from './employee_efficiency/employee_efficiency'; // 导入组件
import ProcessImplementation from './process_implementation/process_implementation';
import TimeOnTask from './time_on_task/time_on_task';
import WorkplaceEfficiency from './workplace_efficiency/workplace_efficiency';
import EmployeeStatus from './employee_status/employee_status';
import ProcessCreate from './process_create/process_create';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";

function App() {
    return (
        <BrowserRouter basename="/web">
            <Routes>
                <Route path="/employeeEfficiency" element={<EmployeeEfficiency />} />
                <Route path="/employeeStatus" element={<EmployeeStatus />} />
                <Route path="/timeOnTask" element={<TimeOnTask />} />
                <Route path="/workplaceEfficiency" element={<WorkplaceEfficiency />} />
                <Route path="/processImplementation" element={<ProcessImplementation />} />
                <Route path="/processCreate" element={<ProcessCreate />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;