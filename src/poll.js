/**
 * @constructor
 * @class
 * The Poll class is a local representation of a poll in the MagnetMax platform. This class provides various
 * poll specific methods, like creating a poll and selecting poll options.
 * @param {object} pollObj An object containing poll information.
 * @param {string} pollObj.name A user-friendly name for the poll.
 * @param {string} pollObj.question The question this poll should answer.
 * @param {Max.PollOption[]} pollObj.options A list of {Max.PollOption}.
 * @param {boolean} [pollObj.allowMultiChoice] If enabled, users can select more than one option. Defaults to true.
 * @param {boolean} [pollObj.hideResultsFromOthers] If enabled, participants cannot obtain results from the poll, and will not receive {Max.PollAnswer} when a participant chooses a poll option. The poll creator can still obtain results using {Max.Poll.get} or poll.refreshResults. Defaults to false.
 * @param {object} [pollObj.extras] A user-defined object used to store arbitrary data will can accessed from a {Max.Poll} instance.
 * @param {Date} [pollObj.endDate] Optionally, specify a date this poll ends. After a poll ends, users can no longer select options.
 * @property {string} pollId Poll identifier.
 * @property {string} name A user-friendly name of the poll.
 * @property {string} question The question this poll should answer.
 * @property {Max.PollOption[]} options The available poll selection options.
 * @property {boolean} allowMultiChoice If enabled, users can select more than one option.
 * @property {boolean} hideResultsFromOthers If enabled, participants cannot obtain results from the poll, and will not receive {Max.PollAnswer} when a participant chooses a poll option. The poll creator can still obtain results using {Max.Poll.get} or poll.refreshResults. Defaults to false.
 * @property {object} extras A user-defined object used to store arbitrary data will can accessed from a {Max.Poll} instance.
 * @property {Date} startDate The date this poll was created.
 * @property {Date} [endDate] The date this poll ends. After a poll ends, users can no longer select options.
 * @property {string} ownerId User identifier of the poll creator.
 * @property {Max.PollOption[]} [myVotes] Poll options selected by the current user, if hideResultsFromOthers was set to false.
 */
Max.Poll = function(pollObj) {
    if (pollObj.allowMultiChoice !== false && pollObj.allowMultiChoice !== true)
        pollObj.allowMultiChoice = true;

    if (pollObj.hideResultsFromOthers !== false && pollObj.hideResultsFromOthers !== true)
        pollObj.hideResultsFromOthers = false;

    pollObj.extras = pollObj.extras || {};
    this.TYPE = Max.MessageType.POLL;
    this.startDate = Max.Utils.dateToISO8601(new Date());

    Max.Utils.mergeObj(this, pollObj);
    return this;
};

/**
 * Get a {Max.Poll} by identifier.
 * @param {string} pollId Poll identifier.
 * @returns {Max.Promise} A promise object returning a {Max.Poll} or reason of failure.
 */
Max.Poll.get = function(pollId) {
    var def = new Max.Deferred(), poll, paths;

    setTimeout(function() {
        if (!mCurrentUser) return def.reject(Max.Error.SESSION_EXPIRED);
        if (!pollId) return def.reject(Max.Error.INVALID_POLL_ID);

        Max.Request({
            method: 'GET',
            url: '/com.magnet.server/surveys/survey/' + pollId + '/poll/results'
        }, function(data, details) {
            poll = Max.PollHelper.surveyToPoll(data.survey, data.summary, data.myAnswers);
            paths = poll.channelIdentifier.split('#');

            Max.Channel.getChannel(paths[1] || paths[0], paths[1] ? paths[0] : null).success(function(channel) {
                poll.channel = channel;
                def.resolve(poll, details);
            }).error(function() {
                def.reject.apply(def, arguments);
            });
        }, function() {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

/**
 * Publish a {Max.Poll} to the given channel.
 * @param {Max.Channel} channel A {Max.Channel} instance of the channel which will receive the poll.
 * @returns {Max.Promise} A promise object returning {Max.Message} or reason of failure.
 */
Max.Poll.prototype.publish = function(channel) {
    var self = this, survey, def = new Max.Deferred();

    setTimeout(function() {
        if (!mCurrentUser)
            return def.reject(Max.Error.SESSION_EXPIRED);
        if (!channel || !channel.getChannelName)
            return def.reject(Max.Error.INVALID_CHANNEL);
        if (!self.name)
            return def.reject(Max.Error.INVALID_POLL_NAME);
        if (!self.question)
            return def.reject(Max.Error.INVALID_POLL_QUESTION);
        if (!self.options || !self.options.length)
            return def.reject(Max.Error.INVALID_POLL_OPTIONS);
        if (self.endDate && self.endDate < new Date())
            return def.reject(Max.Error.INVALID_END_DATE);

        survey = Max.PollHelper.pollToSurvey(self, channel);

        Max.Request({
            method: 'POST',
            url: '/com.magnet.server/surveys/survey',
            data: survey
        }, function (data) {
            self.pollId = data.id;
            self.questionId = data.surveyDefinition.questions[0].questionId;
            self.channel = channel;
            self.channelIdentifier = channel.getChannelName();

            for (var i=0;i<self.options.length;++i) {
                self.options[i].pollId = self.pollId;
                self.options[i].optionId = data.surveyDefinition.questions[0].choices[i];
            }

            var msg = new Max.Message().addPayload(new Max.PollIdentifier(self.pollId));

            channel.publish(msg).success(function(data, details) {
                def.resolve(msg, details);
            }).error(function() {
                def.reject.apply(def, arguments);
            });
        }, function () {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

/**
 * Choose a option for a poll and publish a message to the channel.
 * @param {Max.PollOption|Max.PollOption[]} [pollOptions] One or more {Max.PollOption}. If no options are passed, all votes are removed.
 * @returns {Max.Promise} A promise object returning {Max.Message} or reason of failure.
 */
Max.Poll.prototype.choose = function(pollOptions) {
    var self = this, def = new Max.Deferred(), previousOpts = [], pollAnswer;
    var surveyAnswers = {pollId: self.pollId, answers: []};
    self.myVotes = self.myVotes || [];

    pollOptions = pollOptions || [];

    setTimeout(function() {
        if (!mCurrentUser) return def.reject(Max.Error.SESSION_EXPIRED);
        if (!self.allowMultiChoice && pollOptions && pollOptions.length && pollOptions.length > 1)
            return def.reject(Max.Error.TOO_MANY_POLL_OPTIONS);
        if (self.endDate < new Date())
            return def.reject(Max.Error.POLL_ENDED);

        if (!Max.Utils.isArray(pollOptions))
            pollOptions = [pollOptions];

        previousOpts = self.myVotes.splice(0);

        for (var i=0;i<pollOptions.length;++i) {
            surveyAnswers.answers.push({
                text: pollOptions[i].text,
                questionId: self.questionId,
                selectedOptionId: pollOptions[i].optionId
            });
        }

        Max.Request({
            method: 'PUT',
            url: '/com.magnet.server/surveys/answers/' + self.pollId,
            data: surveyAnswers
        }, function() {
            pollAnswer = new Max.PollAnswer(self, previousOpts, pollOptions, mCurrentUser.userId);

            if (!self.hideResultsFromOthers) {
                var msg = new Max.Message().addPayload(pollAnswer);

                self.channel.publish(msg).success(function(data, details) {
                    def.resolve(msg, details);
                }).error(function() {
                    def.reject.apply(def, arguments);
                });
            } else {
                if (self.ownerId == mCurrentUser.userId)
                    self.updateResults(pollAnswer);
                else
                    self.myVotes = pollOptions;

                def.resolve.apply(def, arguments);
            }
        }, function() {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

/**
 * Delete the current poll. Can only be deleted by the poll creator.
 * @returns {Max.Promise} A promise object returning success report or reason of failure.
 * @ignore
 */
Max.Poll.prototype.delete = function() {
    var self = this, def = new Max.Deferred();

    setTimeout(function() {
        if (!mCurrentUser) return def.reject(Max.Error.SESSION_EXPIRED);
        if (self.ownerId != mCurrentUser.userId) return def.reject(Max.Error.FORBIDDEN);

        Max.Request({
            method: 'DELETE',
            url: '/com.magnet.server/surveys/survey/' + self.pollId
        }, function() {
            def.resolve.apply(def, arguments);
        }, function() {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

/**
 * Update poll results using a poll answer.
 * @param {PollAnswer} pollAnswer A poll answer.
 */
Max.Poll.prototype.updateResults = function(pollAnswer) {
    var optsObj = {}, i;

    if (!pollAnswer.previousSelection.length && !pollAnswer.currentSelection.length) return;

    for (i=0;i<this.options.length;++i) {
        optsObj[this.options[i].optionId] = i;
    }

    for (i=0;i<pollAnswer.previousSelection.length;++i) {
        --this.options[optsObj[pollAnswer.previousSelection[i].optionId]].count;
    }
    for (i=0;i<pollAnswer.currentSelection.length;++i) {
        ++this.options[optsObj[pollAnswer.currentSelection[i].optionId]].count;
    }

    if (mCurrentUser && pollAnswer.userId == mCurrentUser.userId)
        this.myVotes = pollAnswer.currentSelection;
};

/**
 * Refresh the poll results.
 * @returns {Max.Promise} A promise object returning the {Max.Poll} or reason of failure.
 */
Max.Poll.prototype.refreshResults = function() {
    var self = this, def = new Max.Deferred();

    Max.Poll.get(self.pollId).success(function(poll) {
        self.myVotes = poll.myVotes;
        self.options = poll.options;
        def.resolve.apply(def, arguments);
    }).error(function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

/**
 * @constructor
 * @class
 * The PollOption class is a local representation of a poll option in the MagnetMax platform. A {Max.PollOption} instance contains information about the poll option.
 * @param {string} text A user-friendly answer to the {Max.Poll} question.
 * @param {object} [extras] A user-defined object used to store arbitrary data related to the current poll option.
 * @property {string} pollId Poll identifier.
 * @property {string} optionId Poll option identifier.
 * @property {string} text A user-friendly answer to the {Max.Poll} question.
 * @property {object} extras A user-defined object used to store arbitrary data related to the current poll option.
 * @property {number} count The current number of votes cast towards this poll option. Only available if the related {Max.Poll} was created with hideResultsFromOthers set to false.
 */
Max.PollOption = function(text, extras) {
    if (!text) throw('invalid text');

    this.TYPE = Max.MessageType.POLL_OPTION;
    this.text = text;
    this.extras = extras || {};
    this.count = 0;

    return this;
};

/**
 * @constructor
 * @class
 * The PollIdentifier class is returned by the {Max.EventListener} when the associated poll is created in a channel which the current user is subscribed to.
 * @param {string} pollId {Max.Poll} identifier.
 * @property {string} pollId {Max.Poll} identifier.
 */
Max.PollIdentifier = function(pollId) {
    this.TYPE = Max.MessageType.POLL_IDENTIFIER;
    this.pollId = pollId;
};

/**
 * @constructor
 * @class
 * The PollAnswer class is returned by the {Max.EventListener} after a user selects a poll option. It contains all the {Max.PollOption} selected by the user.
 * @param {string} poll {Max.Poll} The poll this answer is related to.
 * @param {Max.PollOption[]} [previousSelection] A list of poll options selected by the current user.
 * @param {Max.PollOption[]} [currentSelection] A list of poll options deselected by the current user.
 * @param {string} userId Identifier of the user who answered the poll.
 * @property {string} pollId {Max.Poll} identifier.
 * @property {string} name Name of the poll.
 * @property {string} question The question this poll should answer.
 * @property {Max.PollOption[]} previousSelection A list of poll options selected by the current user.
 * @property {Max.PollOption[]} currentSelection A list of poll options selected by the current user.
 * @property {string} userId Identifier of the user who answered the poll.
 */
Max.PollAnswer = function(poll, previousSelection, currentSelection, userId) {
    poll = poll || {};
    this.TYPE = Max.MessageType.POLL_ANSWER;
    this.pollId = poll.pollId;
    this.name = poll.name;
    this.question = poll.question;
    this.previousSelection = previousSelection || [];
    this.currentSelection = currentSelection || [];
    this.userId = userId;
};

Max.registerPayloadType(Max.MessageType.POLL, Max.Poll);
Max.registerPayloadType(Max.MessageType.POLL_OPTION, Max.PollOption);
Max.registerPayloadType(Max.MessageType.POLL_IDENTIFIER, Max.PollIdentifier);
Max.registerPayloadType(Max.MessageType.POLL_ANSWER, Max.PollAnswer);

/**
 * @constructor
 * @class
 * Contains helper methods related to polls.
 */
Max.PollHelper = {
    /**
     * Create {Max.Poll} from Survey.
     * @param {object} survey A Survey object.
     * @param {object[]} results A list of objects containing the number of times a {Max.PollOption} was chosen.
     * @param {object[]} myAnswers A list of objects containing choices made by the current user.
     * @returns {Max.Poll} a poll.
     */
    surveyToPoll: function(survey, results, myAnswers) {
        var choices, i, opt, myAnswerOptionIds = [], myAnswerOptions = [], pollObj = {
            options: {}
        };
        results = results || [];

        pollObj.pollId = survey.id;
        pollObj.name = survey.name;
        pollObj.question = survey.surveyDefinition.questions[0].text;
        pollObj.questionId = survey.surveyDefinition.questions[0].questionId;
        pollObj.startDate = Max.Utils.ISO8601ToDate(survey.startDate);
        pollObj.hideResultsFromOthers = survey.surveyDefinition.resultAccessModel === 'PRIVATE';
        pollObj.allowMultiChoice = survey.surveyDefinition.questions[0].type === 'MULTI_CHOICE';
        pollObj.channelIdentifier = survey.surveyDefinition.notificationChannelId;
        pollObj.ownerId = survey.owners[0];
        pollObj.extras = survey.metaData;
        pollObj.options = [];
        choices = survey.surveyDefinition.questions[0].choices;

        if (survey.surveyDefinition.endDate)
            pollObj.endDate = Max.Utils.ISO8601ToDate(survey.surveyDefinition.endDate);

        for (i = 0; i < myAnswers.length; ++i) {
            myAnswerOptionIds.push(myAnswers[i].selectedOptionId);
        }

        for (i = 0; i < choices.length; ++i) {
            opt = new Max.PollOption(choices[i].value, choices[i].metaData);
            opt.pollId = survey.id;
            opt.optionId = choices[i].optionId;
            opt.count = (results && results[i] && results[i].count) ? results[i].count : 0;
            opt.extras = choices[i].metaData || {};
            pollObj.options.push(opt);
            if (myAnswerOptionIds.indexOf(opt.optionId) != -1)
                myAnswerOptions.push(opt);
        }

        if (myAnswerOptions.length)
            pollObj.myVotes = myAnswerOptions;

        return new Max.Poll(pollObj);
    },
    /**
     * Create Survey from {Max.Poll}.
     * @param {Max.Poll} poll A poll.
     * @param {Max.Channel} channel A channel.
     * @returns {object} A survey.
     */
    pollToSurvey: function(poll, channel) {
        var survey = {};

        survey.name = poll.name;
        survey.owners = [mCurrentUser.userId];
        survey.metaData = poll.extras;
        survey.surveyDefinition = {
            resultAccessModel: poll.hideResultsFromOthers ? 'PRIVATE' : 'PUBLIC',
            type: 'POLL',
            notificationChannelId: channel.getChannelName(),
            startDate: poll.startDate,
            endDate: poll.endDate,
            questions: this.pollOptionToSurveyQuestions(poll),
            participantModel: 'PUBLIC' // for user access control
        };
        return survey;
    },
    /**
     * Get a list of Survey questions from {Max.Poll}.
     * @param {object} poll A poll.
     * @returns {object[]} A list of survey questions.
     */
    pollOptionToSurveyQuestions: function(poll) {
        var opts = poll.options, questions = [], choices = [];

        for (var i=0; i<opts.length; ++i) {
            choices.push({
                value: opts[i].text,
                displayOrder: i,
                metaData: opts[i].extras
            });
        }
        questions.push({
            text: poll.question,
            choices: choices,
            displayOrder: 0,
            type: poll.allowMultiChoice ? 'MULTI_CHOICE' : 'SINGLE_CHOICE'
        });
        return questions;
    }
};
