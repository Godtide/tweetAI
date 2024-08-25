const cron = require('cron');
const axios = require('axios');
const connection = require('./mysql')
const util = require('util'); 

const createAutobotsAndPosts = async () => {
    const insertedUsernames = new Set(); // Track inserted usernames
    const insertedPostTitles = new Set(); // Track inserted post titles

    // Promisify the query method
    const query = util.promisify(connection.query).bind(connection);

    for (let i = 0; i < 500; i++) {
        try {
            const userResponse = await axios.get('https://jsonplaceholder.typicode.com/users');
            const user = userResponse.data[Math.floor(Math.random() * userResponse.data.length)];

            // Skip if username already inserted
            if (insertedUsernames.has(user.username)) {
                console.log(`Username ${user.username} already inserted, skipping...`);
                continue;
            }

            // Check if username exists in DB to avoid duplicates
            const results = await query('SELECT username FROM Autobots WHERE username = ?', [user.username]);

            if (results.length === 0) { // If username doesn't exist
                const result = await query('INSERT INTO Autobots (username, name, email) VALUES (?, ?, ?)', [user.username, user.name, user.email]);
                const autbotId = result.insertId;

                // Add to the set of inserted usernames
                insertedUsernames.add(user.username);

                for (let j = 0; j < 10; j++) {
                    const postResponse = await axios.get('https://jsonplaceholder.typicode.com/posts');
                    let post = postResponse.data[Math.floor(Math.random() * postResponse.data.length)];

                    // Ensure unique post title
                    while (insertedPostTitles.has(post.title)) {
                        console.log(`Post title "${post.title}" already used, selecting a new one...`);
                        post = postResponse.data[Math.floor(Math.random() * postResponse.data.length)];
                    }

                    const postResults = await query('SELECT title FROM Posts WHERE title = ?', [post.title]);

                    if (postResults.length === 0) { // If post title doesn't exist
                        const postResult = await query('INSERT INTO Posts (title, body, autbot_id) VALUES (?, ?, ?)', [post.title, post.body, autbotId]);
                        const postId = postResult.insertId;

                        // Add to the set of inserted post titles
                        insertedPostTitles.add(post.title);

                        for (let k = 0; k < 10; k++) {
                            const commentResponse = await axios.get('https://jsonplaceholder.typicode.com/comments');
                            const comment = commentResponse.data[Math.floor(Math.random() * commentResponse.data.length)];

                            await query('INSERT INTO Comments (post_id, body) VALUES (?, ?)', [postId, comment.body]);
                        }
                    } else {
                        console.log(`Post title "${post.title}" already exists in DB, skipping...`);
                    }
                }
            } else {
                console.log(`Username ${user.username} already exists in DB, skipping...`);
            }
        } catch (err) {
            console.error(`Error creating Autobot or associated data: ${err.message}`);
        }
    }
};


const job = new cron.CronJob('0 * * * *', createAutobotsAndPosts);

module.exports = job;