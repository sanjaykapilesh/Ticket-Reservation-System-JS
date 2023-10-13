import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import SeatReservationService from './lib/SeatReservationService.js';
import TicketPaymentService from "src/thirdparty/paymentgateway/TicketPaymentService.js";

export default class TicketService {
  #maximumTicketCount = 20;

  #ticketTypes = {
    ADULT: 'ADULT',
    CHILD: 'CHILD',
    INFANT: 'INFANT'
  };

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

  #getTotalTicketPrice(numTickets, ticketType){
    return numTickets * this.#ticketPrices[ticketType];
  }

  #makePayment(accountId, totalPrice){
    TicketPaymentService.makePayment(accountId, totalPrice);
  }
  #reserveSeat(accountId, totalNumberOfTickets){
    SeatReservationService.reserveSeat(accountId, totalNumberOfTickets);
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {

    if(this.#isAccountIdValid(accountId)){
      throw new InvalidPurchaseException('Invalid Account ID');
    }

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


      if (ticketType === this.#ticketTypes.CHILD) {
        if (hasAdultTicket) {
          totalNumberOfTickets += numTickets;
          totalPrice += numTickets * this.#ticketPrices.CHILD;
        } else {
          throw new InvalidPurchaseException('Child ticket cannot be purchased without an Adult ticket');
        }
      }

      if (ticketType === this.#ticketTypes.INFANT) {
        if (!hasAdultTicket) {
          throw new InvalidPurchaseException('Infant ticket cannot be purchased without an Adult ticket');
        }
      }

    }


    // Make Payment and Reserve a seat
    this.#makePayment(accountId, totalPrice);
    this.#reserveSeat(accountId, totalNumberOfTickets);
  }
}
