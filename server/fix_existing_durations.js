const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const Log = require('./models/Log');

const fixExistingLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const logs = await Log.find({
            time_out: { $exists: true, $ne: null, $ne: '' }
        });

        console.log(`Found ${logs.length} completed logs to check.`);
        let updatedCount = 0;

        for (const log of logs) {
            try {
                if (!log.date || !log.time_in || !log.time_out) {
                    console.log(`Skipping log ${log._id} due to missing fields: date=${log.date}, in=${log.time_in}, out=${log.time_out}`);
                    continue;
                }

                const start = new Date(`${log.date}T${log.time_in}`);
                const end = new Date(`${log.date}T${log.time_out}`);

                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    console.log(`Invalid date/time for ${log.name} on ${log.date}: in=${log.time_in}, out=${log.time_out}`);
                    continue;
                }

                let diffMs = end - start;
                if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight shifts

                const calculatedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

                if (log.hours !== calculatedHours) {
                    const oldHours = log.hours;
                    log.hours = calculatedHours;
                    await log.save();
                    updatedCount++;
                    console.log(`Updated hours for ${log.name} on ${log.date}: ${oldHours} -> ${calculatedHours}`);
                }
            } catch (err) {
                console.error(`Error processing log ${log._id}:`, err.message);
            }
        }

        console.log(`Successfully updated ${updatedCount} logs.`);
        process.exit(0);
    } catch (err) {
        console.error('Error fixing logs:', err);
        process.exit(1);
    }
};

fixExistingLogs();
