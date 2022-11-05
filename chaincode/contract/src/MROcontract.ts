"use strict";

import { Context, Contract } from "fabric-contract-api";
import { TestData, User } from "./interfaces";

export class Avion extends Contract {
    async initLedger(ctx: Context) {
        console.info("---------- START (Initialize Ledger) ----------");

        const test: TestData[] = [
            {
                test: "check",
                status: "commencing countdown",
                error: "nominal",
            },
            {
                test: "all systems go",
                status: "engine ignition",
                error: "nominal",
            },
        ];

        for (let i = 0; i < test.length; ++i) {
            test[i].docType = "user";
            await ctx.stub.putState(
                (i + 1).toString(),
                Buffer.from(JSON.stringify(test[1]))
            );
            console.info("Added <--> ", test[i]);
        }
        console.info("---------- END (Initialize Ledger) ----------");
    }

    async getCompanies(ctx: Context) {
        console.info("---------- START (Get Companies) ----------");
        const compositeIterator = await ctx.stub.getStateByPartialCompositeKey(
            "administrator",
            []
        );
        const output = this.compositeKeyLoop(ctx, compositeIterator, 0);
        console.info("---------- END (Get Companies) ----------");
        return output;
    }

    async getMaintainers(ctx: Context, company: string) {
        console.info("---------- START (Get Maintainers) ----------");

        const compositeIterator = await ctx.stub.getStateByPartialCompositeKey(
            "maintainer",
            [company.toString()]
        );
        const output = this.compositeKeyLoop(ctx, compositeIterator, 1);

        console.info("---------- END (Get Companies) ----------");
        return output;
    }

    async compositeKeyLoop(
        ctx: Context,
        compositeIterator: any,
        attributeIndex: number
    ) {
        let list = []; //  To store list of company Ids if userId is passed as input in function and to store list of userIds if compnayId is passed as input in function
        while (true) {
            const responseRange = await compositeIterator.next();

            //  Validation if list of userIds or companyIds is empty
            if (
                !responseRange ||
                !responseRange.value ||
                !responseRange.value.key
            ) {
                console.log("end of data");
                return list;
            }

            console.log(
                `Response value: ${responseRange.value.key.toString("utf8")}`
            );

            //  Split the composite key to get the companyIds and userIds
            const output = await ctx.stub.splitCompositeKey(
                responseRange.value.key
            );

            list.push(output.attributes[attributeIndex]); //  Adding the list of userIds if filtered on the basis of companyIds or vice versa.
        }
    }

    async registerUser(ctx: Context, userData: string) {
        console.info("---------- START (Register User) ----------");

        const user: User = JSON.parse(userData);
        console.log(user);

        const compositeKey = await ctx.stub.createCompositeKey(
            user.type.toString(),
            [user.company.toString(), user.username.toString()]
        );

        if (!compositeKey) {
            throw new Error("CompositeKey is NULL");
        }

        user.aircraft = [];

        let output;
        if (user.type.toString() == "administrator") {
            const compositeIterator =
                await ctx.stub.getStateByPartialCompositeKey("administrator", [
                    user.company.toString(),
                ]);
            output = await this.compositeKeyLoop(ctx, compositeIterator, 1);
        } else {
            output = await ctx.stub.getState(compositeKey);
            output = output.toString();
        }

        if (output.length != 0) {
            console.log(output);
            throw new Error("User Already Exists");
        }

        console.log(compositeKey);
        await ctx.stub.putState(
            compositeKey,
            Buffer.from(JSON.stringify(user))
        ); //  Store composite key relation for user

        console.info("---------- END (Register User) ----------");
    }

    async checkUser(ctx: Context, userData: string) {
        console.info("---------- START (Check User) ----------");

        const user: User = JSON.parse(userData);
        console.log(user);

        const compositeKey = await ctx.stub.createCompositeKey(
            user.type.toString(),
            [user.company.toString(), user.username.toString()]
        );

        let output = await ctx.stub.getState(compositeKey); //  get the user from the chaincode state
        console.log(JSON.parse(output.toString()));

        output = JSON.parse(output.toString());

        console.info("---------- END (Register User) ----------");
        return output;
    }

    async registerAircraft(
        ctx: Context,
        aircraft: string,
        tailNumber: string,
        company: string,
        image: any
    ) {
        console.info("---------- START (Register Aircraft) ----------");

        const aircraftObj = {
            description: { aircraft, tailNumber, image },
            maintenanceSchedule: [
                {
                    type: "A",
                    lastCompletedDate: null,
                    lastCompletedHours: 0,
                    maxHours: 600,
                },
                {
                    type: "B",
                    lastCompletedDate: null,
                    lastCompletedHours: 0,
                    maxHours: 2500,
                },
                {
                    type: "C",
                    lastCompletedDate: null,
                    lastCompletedHours: 0,
                    maxHours: 8000,
                },
                {
                    type: "D",
                    lastCompletedDate: null,
                    lastCompletedHours: 0,
                    maxHours: 25000,
                },
            ],
            partsList: [],
            flightHours: 0,
            owner: [{ company, purchaseDate: new Date(), soldDate: null }],
            maintainers: [],
            maintenanceReports: [],
        };
        //create new aircraft object
        await ctx.stub.putState(
            tailNumber,
            Buffer.from(JSON.stringify(aircraftObj))
        );

        //assign aircraft to company admin
        const compositeIterator = await ctx.stub.getStateByPartialCompositeKey(
            "administrator",
            [company]
        );
        const username = await this.compositeKeyLoop(ctx, compositeIterator, 1);
        const compositeKey = await ctx.stub.createCompositeKey(
            "administrator",
            [company.toString(), username[0].toString()]
        );
        const output = await ctx.stub.getState(compositeKey);
        let userData = JSON.parse(output.toString());
        userData.aircraft.push(tailNumber);
        // console.log(userData);
        await ctx.stub.putState(
            compositeKey,
            Buffer.from(JSON.stringify(userData))
        );

        console.info("---------- END (Register Aircraft) ----------");
    }

    async getAircraft(ctx: Context, tailNumber: any) {
        console.info("---------- START (Get Aircraft) ----------");

        const data = await ctx.stub.getState(tailNumber);
        const output = JSON.parse(data.toString());

        console.info("---------- END (Get Aircraft) ----------");
        return output;
    }

    async assignAircraft(
        ctx: Context,
        username: any,
        tailNumber: any,
        company: any
    ) {
        console.info("---------- START (Assign Aircraft) ----------");

        //add maintainer to aircraft
        const aircraftData = await this.getAircraft(ctx, tailNumber);
        aircraftData.maintainers.push(username.toString());
        await ctx.stub.putState(
            tailNumber,
            Buffer.from(JSON.stringify(aircraftData))
        );

        //add aircraft to maintainer profile
        const compositeKey = await ctx.stub.createCompositeKey("maintainer", [
            company.toString(),
            username.toString(),
        ]);
        const output = await ctx.stub.getState(compositeKey);
        let user = JSON.parse(output.toString());
        user.aircraft.push(tailNumber.toString());
        await ctx.stub.putState(
            compositeKey,
            Buffer.from(JSON.stringify(user))
        );
        console.info("---------- END (Assign Aircraft) ----------");
    }

    async newPart(ctx: Context, part: any) {
        console.info("---------- START (Get Aircraft) ----------");
        console.log(part);
        part = JSON.parse(part);
        part.totalHours = 0; //make sure new part hours are set to zero
        part.history = [];

        //validate that maximumHours exits and is correct
        if (!part.maximumHours || part.totalHours > part.maximumHours) {
            throw new Error("incorrect max hours parameter");
        }

        //verify that no part exists at that ID
        const check = await ctx.stub.getState(part.description.id);
        if (check.toString().length != 0) {
            throw new Error("part already exists");
        }

        //save part to chain
        await ctx.stub.putState(
            part.description.id,
            Buffer.from(JSON.stringify(part))
        );
        console.info("---------- END (Get Aircraft) ----------");
    }

    async getPart(ctx: Context, partID: any) {
        console.info("---------- START (Get Part) ----------");

        const data = await ctx.stub.getState(partID);
        const output = JSON.parse(data.toString());

        console.info("---------- END (Get Aircraft) ----------");
        return output;
    }

    async updateFlightHours(ctx: Context, tailNumber: any, hours: any) {
        console.info("---------- START (Update Flight Hours) ----------");

        //update aircraft hours
        const aircraft = await this.getAircraft(ctx, tailNumber);
        if (!Number(hours)) {
            //validate hours
            throw new Error("invalid hours");
        }
        aircraft.flightHours += Number(hours);
        await ctx.stub.putState(
            tailNumber,
            Buffer.from(JSON.stringify(aircraft))
        );

        //update part hours
        for (let ii = 0; ii < aircraft.partsList.length; ii++) {
            const part = await this.getPart(
                ctx,
                aircraft.partsList[ii].toString()
            );
            part.totalHours += Number(hours);
            part.history[part.history.length - 1].hours += Number(hours);
            await ctx.stub.putState(
                aircraft.partsList[ii].toString(),
                Buffer.from(JSON.stringify(part))
            );
        }
        console.info("---------- END (Update Flight Hours) ----------");
    }

    async performMaintenance(
        ctx: Context,
        tailNumber: any,
        type: any,
        notes: any,
        replacedParts: any
    ) {
        console.info("---------- START (Perform Maintenance) ----------");

        //get aircraft and update maintenanceReports
        const aircraft = await this.getAircraft(ctx, tailNumber);
        aircraft.maintenanceReports.push({
            date: new Date(),
            type,
            notes,
            partsReplaced: JSON.stringify(replacedParts),
        });

        //update maintenanceSchedule if necessary
        aircraft.maintenanceSchedule.forEach((obj, index) => {
            //only save to the correct maintenance type
            if (obj.type.toString() == type.toString()) {
                aircraft.maintenanceSchedule[index].lastCompletedDate =
                    new Date();
                aircraft.maintenanceSchedule[index].lastCompletedHours =
                    aircraft.flightHours;
            }
        });

        //save aircraft object
        await ctx.stub.putState(
            tailNumber.toString(),
            Buffer.from(JSON.stringify(aircraft))
        );

        console.info("---------- END (Perform Maintenance) ----------");
    }

    async replaceParts(ctx, tailNumber, replacedParts) {
        console.info("---------- START (Replace Parts) ----------");

        replacedParts = JSON.parse(replacedParts);
        const aircraft = await this.getAircraft(ctx, tailNumber);

        //update part information
        console.log(
            Object.keys(replacedParts),
            Object.keys(replacedParts).length
        );
        for (let ii = 0; ii < Object.keys(replacedParts).length; ii++) {
            const newPartID = Object.values(replacedParts)[ii];
            const oldPartID = Object.keys(replacedParts)[ii]; //key should be "newPart"+random string if a new part is added to aircraft

            //check if valid part
            const newPart = await this.getPart(ctx, newPartID);
            console.log(newPart);
            const historyObj = {
                tailNumber,
                hours: 0,
                onDate: new Date(),
                offDate: null,
            };
            //check that it's a valid part to use if not a new part
            if (newPart.history.length > 0) {
                const check =
                    newPart.history[newPart.history.length - 1].offDate;
                if (check == null) {
                    throw new Error("Invalid Part");
                }
            }

            //save new part information
            newPart.history.push(historyObj);
            await ctx.stub.putState(
                newPartID.toString(),
                Buffer.from(JSON.stringify(newPart))
            );

            //update old part (skip if not replacing a part on aircraft)
            if (!oldPartID.includes("newPart")) {
                const oldPart = await this.getPart(ctx, oldPartID);
                oldPart.history[oldPart.history.length - 1].offDate =
                    new Date();
                await ctx.stub.putState(
                    oldPartID.toString(),
                    Buffer.from(JSON.stringify(oldPart))
                );
            }

            //update aircraft information
            const index = aircraft.partsList.indexOf(oldPartID); //get index of old part
            if (index != -1) {
                aircraft.partsList[index] = newPartID;
            } else {
                //push to list if old part is not found
                aircraft.partsList.push(newPartID);
            }
        }

        //push aircraft data
        await ctx.stub.putState(
            tailNumber.toString(),
            Buffer.from(JSON.stringify(aircraft))
        );

        console.info("---------- END (Replace Parts) ----------");
    }

    async sellAircraft(ctx, tailNumber, company) {
        console.info("---------- START (Sell Aircraft) ----------");

        const aircraft = await this.getAircraft(ctx, tailNumber);
        //get current company + add new company
        const oldCompany = aircraft.owner[aircraft.owner.length - 1].company;
        // console.log(oldCompany);
        aircraft.owner[aircraft.owner.length - 1].soldDate = new Date();
        aircraft.owner.push({
            company,
            purchaseDate: new Date(),
            soldDate: null,
        });
        // console.log(aircraft);

        //add admin to list of maintainers (so they also have the aircraft removed)
        const compositeIteratorOld =
            await ctx.stub.getStateByPartialCompositeKey("administrator", [
                oldCompany,
            ]);
        const usernameOld = await this.compositeKeyLoop(
            ctx,
            compositeIteratorOld,
            1
        );
        aircraft.maintainers.push(usernameOld);

        //remove maintainer access
        for (let ii = 0; ii < aircraft.maintainers.length; ii++) {
            const username = aircraft.maintainers[ii];
            const userType = //set usertype to maintainer except for last one (pushed admin earlier)
                aircraft.maintainers.length - 1 == ii
                    ? "administrator"
                    : "maintainer";
            const compositeKey = await ctx.stub.createCompositeKey(userType, [
                oldCompany.toString(),
                username.toString(),
            ]);
            let userData = await ctx.stub.getState(compositeKey);
            userData = JSON.parse(userData.toString());
            userData.aircraft = userData.aircraft.filter(
                (num) => num != tailNumber
            );
            await ctx.stub.putState(
                compositeKey,
                Buffer.from(JSON.stringify(userData))
            );
        }
        //remove maintainer array for aircraft
        aircraft.maintainers = [];
        console.log(aircraft);
        await ctx.stub.putState(
            tailNumber,
            Buffer.from(JSON.stringify(aircraft))
        );

        //add aircraft to new company admin
        const compositeIterator = await ctx.stub.getStateByPartialCompositeKey(
            "administrator",
            [company]
        );
        const usernameNew = await this.compositeKeyLoop(
            ctx,
            compositeIterator,
            1
        );
        const compositeKey = await ctx.stub.createCompositeKey(
            "administrator",
            [company.toString(), usernameNew[0].toString()]
        );
        let admin = await ctx.stub.getState(compositeKey);
        admin = JSON.parse(admin.toString());
        admin.aircraft.push(tailNumber);
        console.log(admin);
        await ctx.stub.putState(
            compositeKey,
            Buffer.from(JSON.stringify(admin))
        );

        console.info("---------- END (Sell Aircraft) ----------");
    }
}
