import React from 'react';
import EfficiencySummary from './employee_efficiency/employee_efficiency'; // 导入组件
import TimeOnTask from './time_on_task/time_on_task';
import './App.css';

function App() {
    return (
        <div className="App">
            {/*<EfficiencySummary />*/}
            <TimeOnTask />
        </div>
    );
}

export default App;