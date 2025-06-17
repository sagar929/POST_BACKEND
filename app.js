const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render("index");
});

app.get('/profile' , isLoggedIn, async (req, res) =>{
    //   console.log(req.user);
   let user =   await userModel.findOne({email: req.user.email}).populate("posts");
//    ab humare array me post aa gyi ha pr woh ek id ki trha ha toh hum kya krte ha yeh dekho ab
 
      res.render("profile", { user });
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

// Show login form
app.get('/login', (req, res) => {
    res.render("login");
});

// Handle login POST request
app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email }); // Await is necessary
    if (!user) return res.status(400).send("User not found");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: user.email, userid: user._id }, "shhhh");
            res.cookie("token", token).send("Login successful");
            res.status(200).redirect("/profile")
        } else {
            res.status(401).send("Incorrect password");
        }
    });
});

app.get('/logout' ,  (req,res)=>{
    res.cookie("token" , "")
    res.redirect("/login");
})


app.post('/createpost', isLoggedIn , async(req,res)=>{
    let user = await userModel.findOne({email: req.user.email})
    let {content} = req.body;
   let post = await postModel.create({
        user: user._id,
        content: content,  
    })
    
    user.posts.push(post._id);
   await user.save();
   res.redirect("/profile");
})

// now we will create a middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
    if (!req.cookies.token || req.cookies.token === "") {
        return res.send("You are not logged in, please login first"); // STOP here
    }

    jwt.verify(req.cookies.token, "shhhh", (err, decoded) => {
        if (err) {
            return res.status(401).send("Invalid token"); // STOP here
        }

        req.user = decoded;
        next(); 
    });
}




app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});
