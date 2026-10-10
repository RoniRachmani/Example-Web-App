// Each article's `name` is its URL and its key in the database, so don't change
// an existing one: its upvotes and comments are stored under it.
const articles = [
  {
    name: 'learn-react',
    title: 'The Fastest Way to Learn React',
    content: [
      `The fastest way to learn React isn't to read about every feature first. It's to build something small straight away and pick up each idea when you need it. Here's the path I'd follow if I were starting today.`,
      `Start with the JavaScript that React leans on: arrow functions, destructuring, the spread syntax, array methods like map and filter, modules, and async/await. If those feel comfortable, React code will read naturally. If they don't, an evening spent on them will save you a week of confusion.`,
      `Next, create a project with Vite by running npm create vite@latest and choosing the React template. You'll have a running app in under a minute. Learn components, JSX and props first: a component is a function that takes props and returns what to show, and a page is a tree of them.`,
      `Then add interactivity. useState gives a component memory, and event handlers like onClick and onChange update it. Practise with controlled inputs, where React holds the value of a text box. Leave useEffect until you need to sync with something outside React, such as a timer or a browser API. You'll need it less often than you think.`,
      `Finally, build a real project: a to-do list first, then a small app that fetches data from an API and has a few pages with React Router. The official docs at react.dev are built around exactly this kind of hands-on learning, with exercises on every page. Use them as your map.`,
    ],
  },
  {
    name: 'learn-node',
    title: 'How to Build a Node Server in 10 Minutes',
    content: [
      `In this article we'll build a small web server with Node.js and Express, the most popular web framework for Node. Ten minutes is plenty: Express does the heavy lifting, so a working API takes only a few lines of code.`,
      `First, set up a project. Make a new folder, run npm init -y to create a package.json, and add "type": "module" to it so you can use import statements. Then install Express with npm install express.`,
      `Now create server.js. Import express and call express() to create an app. Add app.use(express.json()) so the server can read JSON request bodies. Define a route with app.get('/api/hello', (req, res) => res.json({ message: 'Hello!' })). Finally, call app.listen(8000) to start listening on port 8000.`,
      `Run it with node --watch server.js. The --watch flag restarts the server whenever you save a file, so you don't need an extra tool like nodemon. Open http://localhost:8000/api/hello in your browser and you'll see your JSON.`,
      `From here, add POST routes with app.post, check the input they receive, and answer with the right status codes: 400 for bad input, 404 when something doesn't exist. When you're ready to keep data between restarts, connect a database. The next article, on MongoDB, shows you how.`,
    ],
  },
  {
    name: 'mongodb',
    title: 'Learn MongoDB',
    content: [
      `MongoDB is a document database. Instead of rows in tables, it stores JSON-like documents in collections, so the data in your database looks much like the objects in your JavaScript code. That makes it a natural fit for Node.js apps.`,
      `The quickest way to start is a free cluster on MongoDB Atlas, or a local install if you prefer. Connect with the MongoDB Shell, mongosh, to explore: switch to a database with use, then look around with commands like show collections.`,
      `The everyday operations are create, read, update and delete. insertOne adds a document. find and findOne take a filter such as { name: 'learn-react' } and return the documents that match. updateOne changes a document using operators like $set to replace a field, $inc to add to a number and $push to append to an array. deleteOne removes a document.`,
      `From Node, install the official driver with npm install mongodb, connect with a MongoClient, and get a collection with client.db('my-db').collection('articles'). Updates can check and change a document in one atomic step. This blog's upvote button uses findOneAndUpdate with a filter that only matches if you haven't upvoted yet, so a double click can never count twice.`,
      `As your app grows, design your documents around how you read them. Embed data that is always shown together, like an article's comments, and add an index to any field you filter on often. Those two habits will take you a long way.`,
    ],
  },
];

export default articles;
