import React from "react";

function footer() {
  return (
    <div className="nav">
      <div className="content">
        <div className="nav-logo">
          <h1 className="h4 m-0">Copyright @ 2020. <a className="alpha" href="https://github.com/shakilofficial0/Heroku-CyberTOR">CyberTOR-Beta</a></h1>
        </div>
        <div className="nav-links" style={{flexDirection: "row"}}>
          <a className="btn primary" href="https://www.facebook.com/shakilofficialdll" style={{color: "#f7fafc"}}>
    <span className="bnt-icon">
        <ion-icon name="logo-facebook" />
      </span> Facebook
    </a>
     <a className="btn" href="https://github.com/shakilofficial0" style={{color: "#f7fafc"}}>
    <span className="bnt-icon">
        <ion-icon name="logo-github" />
      </span> Github
    </a>
        </div>
      </div>
    </div>
  );
}

export default footer;
