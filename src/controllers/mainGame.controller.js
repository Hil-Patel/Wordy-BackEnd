import { GameData } from '../models/game.model';
import { generate } from 'random-words';

const postLength = (req, res, next) => {
    const { length } = req.body;
    const randomWord = generate({ minLength: length, maxLength: length });
    console.log(randomWord);

    res.json({ randomWord });
};

export {
    postLength
};

