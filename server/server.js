import express from 'express'
import mysql from 'mysql2'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import dotenv from 'dotenv'



const app = express();
app.use(cors(
    {
        origin: ["http://localhost:3000"],
        methods: ["POST", "GET", "PUT", "DELETE"],
        credentials: true
    }
));
dotenv.config();

app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));



const con = mysql.createConnection({
    host: "localhost",
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: "signup",
    port:'3306'
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/Images')


    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage
})

con.connect(function (err) {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.get('/getEmployee', (req, res) => {
    const sql = "SELECT * FROM employee";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Get employee error in sql " });
        return res.json({ Status: "Success", Result: result })
    })
})


app.get('/get/:id', (req, res) => {

    const id = req.params.id;
    const sql = "SELECT * FROM employee where id = ?";
    con.query(sql, [id], (err, result) => {

        if (err) return res.json({ Error: "Get employee error in sql " });
        return res.json({ Status: "Success", Result: result })

    })
})

////////////////////////////////////////////////////////////////////////////////
//////update all (name,email,address,salary)
app.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE employee SET name = ?, email = ?, address = ?, salary = ? WHERE id = ?";
    const { name, email, address, salary } = req.body;

    con.query(sql, [name, email, address, salary, id], (err, result) => {
        if (err) {
            return res.json({ Error: "Update employee error in SQL" });
        }
        return res.json({ Status: "Success" });
    });
});



////for delete
app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM employee WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Error: "Delete employee error in sql " });
        return res.json({ Status: "Success" })


    })

})

///token

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Error: "You are no Authenticated" });
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) return res.json({ Error: "Token wrong" });
            req.role = decoded.role;
            req.id = decoded.id;
            next();
        })
    } 
}

app.get('/dashboard', verifyUser, (req, res) => {
    return res.json({ Status: "Success", role: req.role, id: req.id })        ///, id: req.id
})



/////api for admin count
app.get('/adminCount', (req, res) => {
    const sql = "Select count(id) as admin from users";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in runnig query" });
        return res.json(result);
    })
})
app.get('/employeeCount', (req, res) => {
    const sql = "Select count(id) as employee from employee";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in runnig query" });
        return res.json(result);
    })
})

app.get('/adminList', (req, res) => {
    const sql = "Select email as Email from users";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in runnig query" });
        return res.json(result);
    })
})


app.get('/salary', (req, res) => {
    const sql = "Select sum(salary) as sumOfSalary from employee";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in runnig query" });
        return res.json(result);
    })
})



//////////
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users where email = ? AND password = ?";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if (err) return res.json({ Status: "Error ", Error: "Error in running query" });
        if (result.length > 0) {

            const id = result[0].id;
            const token = jwt.sign({ role: "admin", id: result[0].id }, "jwt-secret-key", { expiresIn: '1d' });      ////expair afrer 1 Day
            res.cookie('token', token);

            return res.json({ Status: "Success" })
        } else {
            return res.json({ Status: "Error ", Error: "Wrong Email or Password" });
        }
    })
})
//////for employee login
app.post('/employeelogin', (req, res) => {
    const sql = "SELECT * FROM employee Where email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if (err) return res.json({ Status: "Error", Error: "Error in runnig query" });
        if (result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response) => {
                if (err) return res.json({ Error: "password error" });
                if (response) {
                    const token = jwt.sign({ role: "employee", id: result[0].id }, "jwt-secret-key", { expiresIn: '1d' });
                    res.cookie('token', token);
                    return res.json({ Status: "Success", id: result[0].id })
                } else {
                    return res.json({ Status: "Error", Error: "Wrong Email or Password" });
                }

            })

        } else {
            return res.json({ Status: "Error", Error: "Wrong Email or Password" });
        }
    })
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ Status: "Success" });
})


app.post('/create', upload.single('image'), (req, res) => {
    const sql = "INSERT INTO employee (`name`,`email`,`password`, `address`, `salary`, `image`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if (err) return res.json({ Error: "error in hashing password" })
        const values = [
            req.body.name,
            req.body.email,
            hash,
            req.body.address,
            req.body.salary,
            req.file.filename
        ]
        con.query(sql, [values], (err, result) => {
            if (err) return res.json({ Error: "inside signup query" })
            return res.json({ Status: "success" })

        })

    })


})

app.listen(8000, () => {
    console.log("Running")
})

