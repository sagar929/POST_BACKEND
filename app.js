const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const userModel = require('./models/user');
// const postModel = require('./models/posts');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render("index");
});

app.get('/profile' , isLoggedIn,  (req, res) =>{
      console.log(req.user);
      res.render("Login");
} )

app.post('/register', async (req, res) => {
    let { email, password, username, name, age } = req.body;

    // Check if user already exists
    let user = await userModel.findOne({ email });
    if (user) return res.status(400).send("User already exists");

    // Generate salt and hash password
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return res.status(500).send("Something went wrong while generating salt");

        bcrypt.hash(password, salt, async (err, hash) => {
            if (err) return res.status(500).send("Error while hashing password");

            let newUser = await userModel.create({
                username,
                name,
                age,
                email,
                password: hash
            });

            let token = jwt.sign({ email: email, userid: newUser._id }, "shhhh");

            // Send response (you were missing this)
            res.cookie("token", token).send("User registered successfully");
        });
    });
});

app.post('/login', (req, res) =>{
  let { email, password } = req.body;

  let user =  userModel.findOne({email});
    if (!user) return res.status(400).send("User not found");

    bcrypt.compare(password, user.password, (err, result) => {
        if(result) res.status(200).send("Login successful");
        else res.redirect("/login");
    });

});

app.get('/logout' ,  (req,res)=>{
    res.cookie("token" , "")
    res.redirect("/login");
})

// now we will create a middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
       if(req.cookies.token=== "") res.send("You are not logged in, please login first");
       else{
        jwt.verify(req.cookies.token, "shhhh", (err, decoded) => {
            if (err) {
                return res.status(401).send("Invalid token");
            }
            // If token is valid, attach user info to request object
            req.user = decoded;
            next();
        }); 
       }
       

} 



app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});
