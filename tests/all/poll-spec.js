/* unit tests for validating Poll class */

var Max = Max || require('../../target/magnet-sdk');

describe('Poll', function() {

    it('should instantiate a new Poll', function(done) {
        var pollObj = {};
        var poll = new Max.Poll(pollObj);
        expect(poll.TYPE).toEqual(Max.MessageType.POLL);
        expect(poll.allowMultiChoice).toEqual(true);
        expect(poll.hideResultsFromOthers).toEqual(false);
        expect(typeof poll.startDate).toEqual('object');
        done();
    });

});

describe('Poll get', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testUserId2 = '4028812953169ff801531e7528d40015';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should fail without valid pollId', function(done) {
        Max.Poll.get().success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual(Max.Error.INVALID_POLL_ID);
            done();
        });
    });

    it('should get a poll object', function(done) {
        var reqDef = new Max.Deferred();
        var pollName = "Poll";
        var question = 'favorite color?';
        var option1Text = 'red';
        var option3Count = 3;
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success({
                "myAnswers": [
                    {
                        "answerId": "ff808081546288a9015462d826330008",
                        "questionId": "ff808081546288a9015462d8188a0002",
                        "responseId": null,
                        "selectedOptionId": "ff808081546288a9015462d8188a0005",
                        "text": "green"
                    }
                ],
                "summary": [
                    {
                        "count": 0,
                        "selectedChoiceId": "ff808081546288a9015462d8188a0003"
                    },
                    {
                        "count": 0,
                        "selectedChoiceId": "ff808081546288a9015462d8188a0004"
                    },
                    {
                        "count": option3Count,
                        "selectedChoiceId": "ff808081546288a9015462d8188a0005"
                    }
                ],
                "survey": {
                    "id": "ff808081546288a9015462d8185b0000",
                    "metaData": {},
                    "name": pollName,
                    "owners": [
                        "4028e5c3545ebb4001545ef1c31b0002"
                    ],
                    "participants": [],
                    "resultViewers": [],
                    "surveyDefinition": {
                        "endDate": null,
                        "notificationChannelId": "4028e5c3545ebb4001545ef1c31b0002#1461887599583",
                        "participantModel": "PUBLIC",
                        "questions": [
                            {
                                "choices": [
                                    {
                                        "displayOrder": 0,
                                        "metaData": {},
                                        "optionId": "ff808081546288a9015462d8188a0003",
                                        "value": option1Text
                                    },
                                    {
                                        "displayOrder": 1,
                                        "metaData": {},
                                        "optionId": "ff808081546288a9015462d8188a0004",
                                        "value": "blue"
                                    },
                                    {
                                        "displayOrder": 2,
                                        "metaData": {},
                                        "optionId": "ff808081546288a9015462d8188a0005",
                                        "value": "green"
                                    }
                                ],
                                "displayOrder": 0,
                                "questionId": "ff808081546288a9015462d8188a0002",
                                "text": question,
                                "type": "SINGLE_CHOICE"
                            }
                        ],
                        "resultAccessModel": "PUBLIC",
                        "startDate": "2016-04-29T16:26:49.663Z",
                        "type": "POLL"
                    }
                }
            });
        });
        var getChannelStub = sinon.stub(Max.Channel, 'getChannel', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve(new Max.Channel({
                    "isCollection": false,
                    "description": "",
                    "isPersistent": true,
                    "maxItems": -1,
                    "maxPayloadSize": 2097152,
                    "creationDate": "2016-02-26T21:27:23.014Z",
                    "modificationDate": "2016-02-26T21:27:23.015Z",
                    "publisherType": "subscribers",
                    "userId": "402881295313de27015315659c71000a",
                    "subscriptionEnabled": true,
                    "topicName": testChannelName,
                    "privateChannel": true
                }));
            }, 5);
            return d.promise;
        });
        Max.Poll.get('40288192510694f6015106960150000a').success(function (poll) {
            expect(poll.name).toEqual(pollName);
            expect(poll.question).toEqual(question);
            expect(poll.allowMultiChoice).toEqual(false);
            expect(poll.hideResultsFromOthers).toEqual(false);
            expect(poll.options[0].text).toEqual(option1Text);
            expect(poll.options[2].count).toEqual(option3Count);
            expect(poll.channel.name).toEqual(testChannelName);
            Max.Request.restore();
            Max.Channel.getChannel.restore();
            done();
        }).error(function (e) {
            Max.Request.restore();
            expect(e).toEqual('failed-test');
            Max.Channel.getChannel.restore();
            done();
        });
    });

});

describe('Poll publish', function() {
    var sendSpy;
    var pollName = "Poll";
    var question = 'favorite color?';
    var option1Text = 'red';
    var option1Count = 1;
    var option2Text = 'blue';
    var option2Count = 2;
    var option3Text = 'green';
    var option3Count = 3;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should fail without valid question', function(done) {
        var poll = new Max.Poll({
            name: pollName,
            allowMultiChoice: true,
            hideResultsFromOthers: false
        });
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": "402881295313de27015315659c71000a",
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });
        poll.publish(channel).success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual(Max.Error.INVALID_POLL_QUESTION);
            done();
        });
    });

    it('should fail without valid channel', function(done) {
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            allowMultiChoice: true,
            hideResultsFromOthers: false
        });
        poll.publish().success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual(Max.Error.INVALID_CHANNEL);
            done();
        });
    });

    it('should fail without valid poll options', function(done) {
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            allowMultiChoice: true,
            hideResultsFromOthers: false
        });
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": "402881295313de27015315659c71000a",
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });

        poll.publish(channel).success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual(Max.Error.INVALID_POLL_OPTIONS);
            done();
        });
    });

    it('should publish a poll to a channel', function(done) {
        var reqDef = new Max.Deferred();
        var pollId = 'ff808081546288a9015462d8185b0000';
        var questionId = 'ff808081546288a9015462d8188a0002';
        var pollName = "Poll";
        var question = 'favorite color?';
        var option1Text = 'red';
        var option3Count = 3;
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success({
                "id": pollId,
                "metaData": {},
                "name": pollName,
                "owners": [
                    "4028e5c3545ebb4001545ef1c31b0002"
                ],
                "participants": [],
                "resultViewers": [],
                "surveyDefinition": {
                    "endDate": null,
                    "notificationChannelId": "4028e5c3545ebb4001545ef1c31b0002#1461887599583",
                    "participantModel": "PUBLIC",
                    "questions": [
                        {
                            "choices": [
                                {
                                    "displayOrder": 0,
                                    "metaData": {},
                                    "optionId": "ff808081546288a9015462d8188a0003",
                                    "value": option1Text
                                },
                                {
                                    "displayOrder": 1,
                                    "metaData": {},
                                    "optionId": "ff808081546288a9015462d8188a0004",
                                    "value": "blue"
                                },
                                {
                                    "displayOrder": 2,
                                    "metaData": {},
                                    "optionId": "ff808081546288a9015462d8188a0005",
                                    "value": "green"
                                }
                            ],
                            "displayOrder": 0,
                            "questionId": questionId,
                            "text": question,
                            "type": "SINGLE_CHOICE"
                        }
                    ],
                    "resultAccessModel": "PUBLIC",
                    "startDate": "2016-04-29T16:26:49.663Z",
                    "type": "POLL"
                }
            });
        });
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: true,
            hideResultsFromOthers: false
        });
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": "402881295313de27015315659c71000a",
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });
        var publishStub = sinon.stub(channel, 'publish', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 5);
            return d.promise;
        });

        poll.publish(channel).success(function() {
            expect(poll.pollId).toEqual(pollId);
            expect(poll.questionId).toEqual(questionId);
            expect(publishStub.calledOnce).toEqual(true);
            expect(reqStub.calledOnce).toEqual(true);
            Max.Request.restore();
            done();
        }).error(function(e) {
            Max.Request.restore();
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Poll publish', function() {
    var sendSpy;
    var pollName = "Poll";
    var question = 'favorite color?';
    var option1Text = 'red';
    var option1Count = 1;
    var option2Text = 'blue';
    var option2Count = 2;
    var option3Text = 'green';
    var option3Count = 3;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should fail with not allowMultiChoice and multiple options were selected', function(done) {
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: false
        });
        poll.choose([poll.options[0], poll.options[1]]).success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual(Max.Error.TOO_MANY_POLL_OPTIONS);
            done();
        });
    });

    it('should fail if poll has ended', function(done) {
        var pastDate = new Date();
        pastDate.setDate(pastDate.getHours() - 24);
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: false,
            endDate: pastDate
        });
        poll.choose([poll.options[0]]).success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual(Max.Error.POLL_ENDED);
            done();
        });
    });

    it('should choose an option', function(done) {
        var reqDef = new Max.Deferred();
        var pollId = 'ff808081546288a9015462d8185b0000';
        var questionId = 'ff808081546288a9015462d8188a0002';
        var pollName = "Poll";
        var question = 'favorite color?';
        var option1Text = 'red';
        var option3Count = 3;
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success();
        });
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: false
        });
        poll.options[0].optionId = 1;
        poll.options[0].optionId = 2;
        poll.options[0].optionId = 3;
        poll.channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": "402881295313de27015315659c71000a",
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });
        var publishStub = sinon.stub(poll.channel, 'publish', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 5);
            return d.promise;
        });

        poll.choose(poll.options[0]).success(function() {
            expect(poll.myVotes.length).toEqual(1);
            expect(poll.myVotes[0].text).toEqual(option1Text);
            expect(poll.options[0].count).toEqual(1);
            expect(reqStub.calledOnce).toEqual(true);
            expect(publishStub.calledOnce).toEqual(true);
            Max.Request.restore();
            done();
        }).error(function(e) {
            Max.Request.restore();
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should choose an option without updating counts with hideResultsFromOthers set true', function(done) {
        var reqDef = new Max.Deferred();
        var pollId = 'ff808081546288a9015462d8185b0000';
        var questionId = 'ff808081546288a9015462d8188a0002';
        var pollName = "Poll";
        var question = 'favorite color?';
        var option1Text = 'red';
        var option3Count = 3;
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success();
        });
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: true
        });
        poll.options[0].optionId = 1;
        poll.options[0].optionId = 2;
        poll.options[0].optionId = 3;
        poll.channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": "402881295313de27015315659c71000a",
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });
        var publishStub = sinon.stub(poll.channel, 'publish', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 5);
            return d.promise;
        });

        poll.choose(poll.options[0]).success(function() {
            expect(poll.myVotes.length).toEqual(1);
            expect(poll.myVotes[0].text).toEqual(option1Text);
            expect(poll.options[0].count).toEqual(0);
            expect(reqStub.calledOnce).toEqual(true);
            expect(publishStub.calledOnce).toEqual(false);
            Max.Request.restore();
            done();
        }).error(function(e) {
            Max.Request.restore();
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Poll delete', function() {
    var sendSpy;
    var pollName = "Poll";
    var question = 'favorite color?';
    var option1Text = 'red';
    var option1Count = 1;
    var option2Text = 'blue';
    var option2Count = 2;
    var option3Text = 'green';
    var option3Count = 3;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function () {
        Max.setUser({
            userId: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function () {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should fail delete if not poll owner', function (done) {
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success();
        });
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: false,
            ownerId: 'different-user-id'
        });
        poll.delete().success(function (res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function (e) {
            expect(e).toEqual(Max.Error.FORBIDDEN);
            expect(reqStub.calledOnce).toEqual(false);
            Max.Request.restore();
            done();
        });
    });
    it('should delete poll', function (done) {
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success();
        });
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: false,
            ownerId: testUserId
        });
        poll.delete().success(function (res) {
            expect(reqStub.calledOnce).toEqual(true);
            Max.Request.restore();
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });
});

describe('Poll updateResults', function() {
    var sendSpy;
    var pollName = "Poll";
    var question = 'favorite color?';
    var option1Text = 'red';
    var option1Count = 1;
    var option2Text = 'blue';
    var option2Count = 2;
    var option3Text = 'green';
    var option3Count = 3;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function () {
        Max.setUser({
            userId: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function () {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should not update if current userId matches pollanswer sender userId', function (done) {
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: false,
            ownerId: testUserId
        });
        poll.options[0].optionId = 1;
        poll.options[0].count = 1;
        poll.options[1].optionId = 2;
        poll.options[1].count = 0;
        poll.options[2].optionId = 3;
        poll.options[2].count = 0;
        var pollAnswer = new Max.PollAnswer(poll, [poll.options[0]], [poll.options[1]], testUserId);
        poll.updateResults(pollAnswer);
        expect(poll.options[0].count).toEqual(1);
        expect(poll.options[1].count).toEqual(0);
        expect(poll.options[2].count).toEqual(0);
        done();
    });

    it('should update poll results correctly if forceUpdate true', function (done) {
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: false,
            ownerId: testUserId
        });
        poll.options[0].optionId = 1;
        poll.options[0].count = 1;
        poll.options[1].optionId = 2;
        poll.options[1].count = 0;
        poll.options[2].optionId = 3;
        poll.options[2].count = 0;
        var pollAnswer = new Max.PollAnswer(poll, [poll.options[0]], [poll.options[1]], testUserId);
        poll.updateResults(pollAnswer, true);
        expect(poll.options[0].count).toEqual(0);
        expect(poll.options[1].count).toEqual(1);
        expect(poll.options[2].count).toEqual(0);
        done();
    });
});

describe('Poll delete', function() {
    var sendSpy;
    var pollName = "Poll";
    var question = 'favorite color?';
    var option1Text = 'red';
    var option1Count = 1;
    var option2Text = 'blue';
    var option2Count = 2;
    var option3Text = 'green';
    var option3Count = 3;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function () {
        Max.setUser({
            userId: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function () {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should fail delete if not poll owner', function (done) {
        var opts = [
            new Max.PollOption(option1Text),
            new Max.PollOption(option2Text),
            new Max.PollOption(option3Text)
        ];
        var getStub = sinon.stub(Max.Poll, 'get', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                var updatedPoll = {
                    myVotes: [
                        new Max.PollOption(option1Text),
                        new Max.PollOption(option2Text)
                    ],
                    options: opts
                };
                updatedPoll.options[0].count = 3;
                updatedPoll.options[1].count = 4;
                updatedPoll.options[2].count = 5;
                d.resolve(updatedPoll);
            }, 5);
            return d.promise;
        });
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: opts,
            allowMultiChoice: false,
            hideResultsFromOthers: false,
            ownerId: testUserId
        });
        poll.refreshResults().success(function (res) {
            expect(poll.options[0].count).toEqual(3);
            expect(poll.options[1].count).toEqual(4);
            expect(poll.options[2].count).toEqual(5);
            expect(getStub.calledOnce).toEqual(true);
            Max.Poll.get.restore();
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            Max.Poll.get.restore();
            done();
        });
    });
});

describe('PollOption', function() {

    it('should fail instantiating new object if text missing', function (done) {
        expect(function(){ new Max.PollOption(); }).toThrow('invalid text');
        done();
    });

    it('should instantiate', function (done) {
        var pollOption = new Max.PollOption('red');
        expect(pollOption.TYPE).toEqual(Max.MessageType.POLL_OPTION);
        done();
    });
});

describe('PollIdentifier', function() {

    it('should instantiate', function (done) {
        var pollId = 'test-poll-id';
        var pollIdentifier = new Max.PollIdentifier(pollId);
        expect(pollIdentifier.TYPE).toEqual(Max.MessageType.POLL_IDENTIFIER);
        done();
    });
});

describe('PollAnswer', function() {
    var pollName = "Poll";
    var question = 'favorite color?';
    var option1Text = 'red';
    var option2Text = 'blue';
    var option3Text = 'green';
    var testUserId = 'test-user-id-1';

    it('should instantiate', function (done) {
        var poll = new Max.Poll({
            name: pollName,
            question: question,
            options: [
                new Max.PollOption(option1Text),
                new Max.PollOption(option2Text),
                new Max.PollOption(option3Text)
            ],
            allowMultiChoice: false,
            hideResultsFromOthers: false,
            ownerId: testUserId
        });
        var pollAnswer = new Max.PollAnswer(poll, [poll.options[0]], [poll.options[1]], testUserId);
        expect(pollAnswer.previousSelection.length).toEqual(1);
        expect(pollAnswer.currentSelection.length).toEqual(1);
        expect(pollAnswer.name).toEqual(pollName);
        expect(pollAnswer.question).toEqual(question);
        done();
    });
});
