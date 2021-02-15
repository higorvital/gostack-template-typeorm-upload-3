import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionsRouter = Router();


transactionsRouter.get('/', async (request, response) => {
    
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  
  const transactions = await transactionsRepository.find();

  const balance = await transactionsRepository.getBalance();

  return response.status(200).json({
    transactions,
    balance
  });


});

transactionsRouter.post('/', async (request, response) => {
  const {title, value, type, category} = request.body;

  const createTransactionService = new CreateTransactionService();

  const transaction = await createTransactionService.execute({title, value, type, category});

  return response.status(200).json(transaction);

});


transactionsRouter.delete('/:id', async (request, response) => {
  // TODO
  const {id} = request.params;

  const deleteTransactionService = new DeleteTransactionService();

  await deleteTransactionService.execute(id);

  return response.status(200).send();
});

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  // TODO
  const filepath = request.file.path;

  const importTransactionsService = new ImportTransactionsService();

  const transactions = await importTransactionsService.execute(filepath);

  return response.status(200).json(transactions);

});

export default transactionsRouter;
