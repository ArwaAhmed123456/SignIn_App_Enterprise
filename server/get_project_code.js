const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Project = mongoose.model('Project', new mongoose.Schema({ code: String }, { strict: false }));
        const project = await Project.findOne();
        if (project) {
            console.log('Project Code:', project.code);
        } else {
            console.log('No project found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
