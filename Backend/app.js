const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const connection = require('./mysql')
const job = require('./job');
const http = require('http');
const io = require('socket.io')(http);
const app = express();
const { swaggerUi, swaggerSpec } = require('./swagger');
require('dotenv').config()


const limiter = new RateLimiterMemory({
    points: 5, // 5 requests
    duration: 60, // per 60 seconds by IP
});

job.start();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


/**
 * @swagger
 * /api/autobots:
 *   get:
 *     summary: Retrieve a list of Autobots
 *     responses:
 *       200:
 *         description: A list of Autobots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The Autobot ID
 *                     example: 1
 *                   username:
 *                     type: string
 *                     description: The Autobot username
 *                     example: john_doe
 *                   name:
 *                     type: string
 *                     description: The Autobot name
 *                     example: Nicholas Runolfsdottir V
 *                   email:
 *                     type: string
 *                     description: The autobot email
 *                     example: Rey.Padberg@karina.biz
 *                    
 */
app.get('/api/autobots', (req, res) => {
    limiter.consume(req.ip)
        .then(() => {
            connection.query('SELECT * FROM Autobots LIMIT 10', (err, results) => {
                if (err) throw err;
                res.json(results);
            });
        })
        .catch(() => {
            res.status(429).send('Too Many Requests');
        });
});


/**
 * @swagger
 * /api/autobots/{id}/posts:
 *   get:
 *     summary: Retrieve a list of Post by Autobot's ID
 *     description: Retrieve a list of posts associated with a specific Autobot using the Autobot's ID.
 *     tags:
 *       - Autobots
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the Autobot for which to retrieve posts
 *             
 *     responses:
 *       200:
 *         description: A list of Posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The Post ID
 *                     example: 1
 *                   title:
 *                     type: string
 *                     description: The Post title
 *                     example: labore in ex et explicabo corporis aut quas
 *                   body:
 *                     type: string
 *                     description: The Post body
 *                     example: ex quod dolorem ea eum iure qui provident amet\nquia qui facere excepturi et repudiandae\nasperiores molestias provident\nminus incidunt vero fugit
 *                   autbot_id:
 *                     type: integer
 *                     description: The autobot ID
 *                     example: 1
 *                    
 */
app.get('/api/autobots/:id/posts', (req, res) => {
    limiter.consume(req.ip)
        .then(() => {
            connection.query('SELECT * FROM Posts WHERE autbot_id = ? LIMIT 10', [req.params.id], (err, results) => {
                if (err) throw err;
                res.json(results);
            });
        })
        .catch(() => {
            res.status(429).send('Too Many Requests');
        });
});



/**
 * @swagger
 * /api/posts/{id}/comments:
 *   get:
 *     summary: Retrieve a list of comments by Post's ID
 *     description: Retrieve a list of comments associated with a specific Post using the Post's ID.
 *     tags:
 *       - Autobots
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the Post for which to retrieve comments
 *             
 *     responses:
 *       200:
 *         description: A list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The Comment ID
 *                     example: 1
 *                   post_id:
 *                     type: integer
 *                     description: The Post ID
 *                     example: 9
 *                   body:
 *                     type: string
 *                     description: The Comment body
 *                     example: dolor unde numquam distinctio\nducimus eum hic rerum
 *      
 *                    
 */
app.get('/api/posts/:id/comments', (req, res) => {
    limiter.consume(req.ip)
        .then(() => {
            connection.query('SELECT * FROM Comments WHERE post_id = ? LIMIT 10', [req.params.id], (err, results) => {
                if (err) throw err;
                res.json(results);
            });
        })
        .catch(() => {
            res.status(429).send('Too Many Requests');
        });
});



/**
 * @swagger
 * /api/update-autobot-count:
 *   post:
 *     summary: Update the Autobot count
 *     description: Updates the count of Autobots based on the current system status.
 *     tags:
 *       - Autobots
 *     responses:
 *       200:
 *         description: A list of Autobots
 *         content:
 *           application/json:
 *          
 *                    
 */

app.post('/api/update-autobot-count', (req, res) => {
    connection.query('SELECT COUNT(*) as count FROM Autobots', (err, results) => {
        if (err) throw err;
        io.emit('autobot-count', results[0].count);
        res.sendStatus(200);
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
