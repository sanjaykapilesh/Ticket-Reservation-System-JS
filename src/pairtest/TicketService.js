import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import SeatReservationService from './lib/SeatReservationService.js';
import TicketPaymentService from "src/thirdparty/paymentgateway/TicketPaymentService.js";

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

    // Denotes the maximum number of tickets that can be purchased in a single transaction.
  #maximumTicketCount = 20;

  // Denotes the types of tickets that can be purchased.
  #ticketTypes = {
    ADULT: 'ADULT',
    CHILD: 'CHILD',
    INFANT: 'INFANT'
  };

  // Denotes the price of each ticket type.
  #ticketPrices = {
    ADULT: 20,
    CHILD: 10,
    INFANT: 0
  }

  /**
   * Checks if the accountId is valid.
   * @param {number} accountId
   */
  #isAccountIdValid(accountId){
    return accountId && accountId > 0;
  }

  /**
   * Calculates the total price of the tickets.
   * @param {number} numTickets
   * @param {string} ticketType
   */
  #getTotalTicketPrice(numTickets, ticketType){
    return numTickets * this.#ticketPrices[ticketType];
  }

  /**
   * Handles payment for tickets using `TicketPaymentService`
   * @param {number} accountId
   * @param {number} totalPrice
   */
  #makePayment(accountId, totalPrice){
    TicketPaymentService.makePayment(accountId, totalPrice);
  }

  /**
   * Handles seat reservation using `SeatReservationService`
   * @param {number} accountId
   * @param {number} totalNumberOfTickets
   */
  #reserveSeat(accountId, totalNumberOfTickets){
    SeatReservationService.reserveSeat(accountId, totalNumberOfTickets);
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {

    // Check if the accountId is valid
    if(this.#isAccountIdValid(accountId)){
      throw new InvalidPurchaseException('Invalid Account ID');
    }

    let childTickets = [];
    let totalNumberOfTickets = 0;
    let totalPrice = 0;
    let hasAdultTicket = false;

    // Iterate through the ticketTypeRequests
    for(const ticketRequest of ticketTypeRequests){
      const ticketType = ticketRequest.getTicketType();
      const numTickets = ticketRequest.getNoOfTickets();

      // If the ticketType is adult, set hasAdultTicket to true and add the total number of tickets and total price
      if(ticketType === this.#ticketTypes.ADULT){
        hasAdultTicket = true;
        totalNumberOfTickets+=numTickets;
        totalPrice+= this.#getTotalTicketPrice(numTickets, ticketType);
      }

      // If the ticketType is child and no adult ticket has been purchased, Store it in array to be processed later
      if ((ticketType === this.#ticketTypes.CHILD) && !hasAdultTicket) {
        childTickets.push(ticketRequest);
        continue;
      }

      // If the ticketType is child and adult ticket is purchased, add the total number of tickets and total price
      if(ticketType === this.#ticketTypes.CHILD){
        totalNumberOfTickets+=numTickets;
        totalPrice+= this.#getTotalTicketPrice(numTickets, ticketType);
      }

      // If the ticketType is infant and no adult ticket has been purchased, throw an exception
      if((ticketType === this.#ticketTypes.INFANT) && !hasAdultTicket){
        throw new InvalidPurchaseException("Infant ticket must be purchased with an adult ticket")
      }

      // If total number of tickets has exceeded the maximum ticket count, throw an exception
      if (totalNumberOfTickets > this.#maximumTicketCount) {
        throw new InvalidPurchaseException('Exceeded maximum ticket count');
      }
    }

    // Process the child tickets if an adult ticket has been purchased, else throw an exception
    if(childTickets.length > 0 && hasAdultTicket){
      for(const ticketRequest of childTickets){
        const ticketType = ticketRequest.getTicketType();
        const numTickets = ticketRequest.getNoOfTickets();

        totalNumberOfTickets+=numTickets;
        totalPrice+= this.#getTotalTicketPrice(numTickets, ticketType);
      }
    } else {
      throw InvalidPurchaseException("Child ticket must be purchased with an adult ticket");
    }

    // Make Payment and Reserve a seat
    this.#makePayment(accountId, totalPrice);
    this.#reserveSeat(accountId, totalNumberOfTickets);
  }
}
