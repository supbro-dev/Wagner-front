import React from 'react';
import EfficiencySummary from './employee_efficiency/employee_efficiency'; // 导入组件
import TimeOnTask from './time_on_task/time_on_task';
import Test from './test/test';
import WorkplaceEfficiency from './workplace_efficiency/workplace_efficiency';
import EmployeeStatus from './employee_status/employee_status';
import './App.css';

function App() {
    return (
        <div className="App">
            {/*<EfficiencySummary />*/}
            {/*<WorkplaceEfficiency />*/}
            {/*<TimeOnTask />*/}
            <EmployeeStatus />
            {/*<Test />*/}
        </div>
    );
}

export default App;