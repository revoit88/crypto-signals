import React from "react";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import Layout from "@crypto-signals/layout";
import Home from "@crypto-signals/views/home";
import Reports from "@crypto-signals/views/reports";
import Pairs from "@crypto-signals/views/pairs";
import About from "@crypto-signals/views/about";
import Disclaimer from "@crypto-signals/views/disclaimer";

const routes = [
  { path: "/", exact: true, component: Home, id: "home-route" },
  { path: "/reports",  component: Reports, id: "reports-route" },
  { path: "/pairs",  component: Pairs, id: "pairs-route" },
  { path: "/about",  component: About, id: "about-route" },
  { path: "/disclaimer",  component: Disclaimer, id: "disclaimer-route" },
];

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Switch>
          {routes.map(route => (
            <Route
              path={route.path}
              exact={!!route.exact}
              component={route.component}
              key={route.id}
            />
          ))}
          <Redirect to="/" />
        </Switch>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
