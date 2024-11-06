import React from 'react';
import AuthProvider from './Context/AuthProvider';
// import Layouts from './components/Layout/Layout';
// import Skype from './pages/Skype';
import MainRoute from './Route/route';


const App = () => {
  return (
    <div>
      <AuthProvider>
       <MainRoute/>
     </AuthProvider>
    </div>
  );
};

export default App;